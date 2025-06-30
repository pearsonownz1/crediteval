import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@11.16.0?target=deno&deno-std=0.132.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts"; // Use shared CORS headers
// NOTE: No server-side PostHog library import needed, using fetch API directly.

console.log("Stripe webhook function initialized.");

// Environment variables
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const stripeWebhookSigningSecret = Deno.env.get(
  "STRIPE_WEBHOOK_SIGNING_SECRET"
);
const posthogApiKey = Deno.env.get("POSTHOG_API_KEY"); // Get PostHog API Key
const posthogHost = Deno.env.get("POSTHOG_HOST") || "https://us.i.posthog.com"; // Get PostHog Host or default

// Initialize Stripe and Supabase clients
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    })
  : null;
const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null;

serve(async (req) => {
  // Check essential config first
  if (!stripe || !supabaseAdmin || !stripeWebhookSigningSecret) {
    console.error(
      "Missing critical environment variables (Stripe, Supabase, or Webhook Secret)."
    );
    return new Response(
      JSON.stringify({ error: "Server configuration error." }),
      { status: 500 }
    );
  }
  // PostHog key is needed for event tracking but not critical for webhook function itself
  if (!posthogApiKey) {
    console.warn(
      "Missing POSTHOG_API_KEY environment variable. Payment completion events will not be tracked."
    );
  }

  const signature = req.headers.get("Stripe-Signature");
  const body = await req.text(); // Read body as text for signature verification

  let receivedEvent: Stripe.Event;
  try {
    if (!signature) {
      throw new Error("Missing Stripe-Signature header.");
    }
    receivedEvent = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      stripeWebhookSigningSecret,
      undefined, // Explicitly pass undefined for the fourth argument (options)
      Stripe.createSubtleCryptoProvider() // Use Deno's crypto provider
    );
    console.log(
      `Webhook event received: ${receivedEvent.id}, Type: ${receivedEvent.type}`
    );
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle the checkout.session.completed event
  if (receivedEvent.type === "checkout.session.completed") {
    const session = receivedEvent.data.object as Stripe.Checkout.Session;
    console.log(
      "Processing checkout.session.completed event for session:",
      session.id
    );

    // Extract quote_id from metadata
    const quoteId = session.metadata?.quote_id;
    const paymentStatus = session.payment_status;

    if (paymentStatus === "paid" && quoteId) {
      console.log(
        `Payment successful for Quote ID: ${quoteId}. Processing order creation and status update.`
      );
      try {
        // 1. Fetch the full quote details
        const { data: quoteData, error: fetchError } = await supabaseAdmin
          .from("quotes")
          .select("*")
          .eq("id", quoteId)
          .maybeSingle(); // Use maybeSingle to handle potential null

        if (fetchError || !quoteData) {
          console.error(
            `Failed to fetch quote ${quoteId} for order creation:`,
            fetchError
          );
          throw new Error(`Could not fetch quote details for ID: ${quoteId}`);
        }

        console.log(`Fetched quote data for order creation:`, quoteData);

        // 2. Prepare order data from quote data
        const nameParts = quoteData.name?.split(" ") || ["", ""];
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ") || firstName; // Handle single names
        const orderTotalAmount = Math.round(Number(quoteData.price || 0) * 100); // Convert decimal price to integer cents

        const newOrderData = {
          // Map quote fields to order fields
          first_name: firstName,
          last_name: lastName,
          email: quoteData.email,
          status: "processing", // Or 'pending', 'paid' depending on workflow
          stripe_payment_intent_id: session.payment_intent, // Use payment_intent from session
          total_amount: orderTotalAmount,
          // Attempt to store service_type in services JSON if possible
          // This assumes 'services' is a JSONB column in 'orders'
          // Adjust structure as needed based on actual 'orders' table
          services: {
            type: "quote_conversion", // Indicate source
            service_type: quoteData.service_type,
            original_quote_id: quoteId,
          },
          // phone: quoteData.phone, // Add if phone exists in quotes and orders
          // document_paths: quoteData.document_paths, // Add if needed
        };

        console.log("Prepared new order data:", newOrderData);

        // 3. Insert the new order
        const { data: orderInsertResult, error: orderInsertError } =
          await supabaseAdmin
            .from(Deno.env.get("VITE_SUPABASE_ORDERS_TABLE"))
            .insert(newOrderData)
            .select("id") // Select the new order ID
            .single();

        if (orderInsertError) {
          console.error(
            `Failed to insert order for quote ${quoteId}:`,
            orderInsertError
          );
          throw new Error(`Database error creating order from quote.`);
        }

        const newOrderId = orderInsertResult?.id;
        console.log(
          `Successfully created order ${newOrderId} from quote ${quoteId}.`
        );

        // 4. Update the original quote status to 'Paid'
        const { error: quoteUpdateError } = await supabaseAdmin
          .from("quotes")
          .update({ status: "Paid" }) // Update status to Paid
          .eq("id", quoteId);
        // Removed status='Pending' check to ensure it gets marked Paid even if status changed unexpectedly

        if (quoteUpdateError) {
          console.error(
            `Failed to update quote ${quoteId} status to Paid:`,
            quoteUpdateError
          );
          // Log error but don't fail the webhook response
        } else {
          console.log(`Successfully updated quote ${quoteId} status to Paid.`);
        }

        // --- PostHog Event Capture ---
        if (posthogApiKey && quoteData.email) {
          const eventPayload = {
            api_key: posthogApiKey,
            event: "payment_completed",
            properties: {
              distinct_id: quoteData.email, // Use email as the identifier
              quote_id: quoteId,
              order_id: newOrderId, // Include the newly created order ID
              amount: quoteData.price,
              service_type: quoteData.service_type,
              $geoip_disable: true, // Recommended for server-side events
            },
            timestamp: new Date().toISOString(),
          };

          console.log(
            `Sending payment_completed event to PostHog for quote ${quoteId}`
          );
          fetch(`${posthogHost}/capture/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(eventPayload),
          })
            .then((response) => {
              if (!response.ok) {
                console.error(
                  `PostHog API request failed with status ${response.status}:`,
                  response.statusText
                );
                response
                  .text()
                  .then((text) =>
                    console.error("PostHog API response body:", text)
                  );
              } else {
                console.log(
                  `PostHog event payment_completed sent successfully for quote ${quoteId}.`
                );
              }
            })
            .catch((err) => {
              console.error(`Error sending event to PostHog: ${err.message}`);
            });
          // Intentionally not awaiting fetch - let it run in background
        }
        // --- End PostHog Event Capture ---

        // 5. Send notification email to staff
        // Check for Resend env vars - NOTE: These were missing in the original code snippet provided
        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
        const FROM_EMAIL = Deno.env.get("FROM_EMAIL");
        const RESEND_API_URL = "https://api.resend.com/emails"; // Define Resend API URL

        if (newOrderId && RESEND_API_KEY && FROM_EMAIL) {
          const staffNotificationSubject = `New Order Placed from Quote: ${newOrderId}`;
          const staffNotificationBody = `
              <p>A new order has been successfully created from a paid quote.</p>
              <ul>
                <li><strong>New Order ID:</strong> ${newOrderId}</li>
                <li><strong>Original Quote ID:</strong> ${quoteId}</li>
                <li><strong>Client Name:</strong> ${firstName} ${lastName}</li>
                <li><strong>Client Email:</strong> ${quoteData.email}</li>
                <li><strong>Service Type:</strong> ${
                  quoteData.service_type
                }</li>
                <li><strong>Amount Paid:</strong> $${(
                  orderTotalAmount / 100
                ).toFixed(2)}</li>
              </ul>
              <p>Please review the order in the admin dashboard.</p>
            `;
          const staffEmails = ["support@gcs.org", "guy@gcs.org"]; // Staff emails

          try {
            console.log(
              `Sending staff notification for order ${newOrderId} to: ${staffEmails.join(
                ", "
              )}`
            );
            const staffResendResponse = await fetch(RESEND_API_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
              },
              body: JSON.stringify({
                from: FROM_EMAIL,
                to: staffEmails,
                subject: staffNotificationSubject,
                html: staffNotificationBody,
              }),
            });
            if (!staffResendResponse.ok) {
              const staffResendData = await staffResendResponse.json();
              console.error(
                "Failed to send staff notification email:",
                staffResendData
              );
            } else {
              console.log(
                `Staff notification email sent successfully for order ${newOrderId}.`
              );
            }
          } catch (emailError) {
            console.error(
              "Exception sending staff notification email:",
              emailError
            );
          }
        } else {
          console.warn(
            `Skipping staff notification for order ${newOrderId} due to missing config or order ID.`
          );
        }
      } catch (processingError) {
        console.error(
          `Error processing paid quote ${quoteId}:`,
          processingError
        );
        // Return 500 to signal Stripe to retry if processing failed critically
        return new Response(
          JSON.stringify({
            error: "Webhook handler failed",
            details: processingError.message,
          }),
          { status: 500 }
        );
      }
    } else {
      console.log(
        `Ignoring checkout session ${session.id}. Payment status: ${paymentStatus}, Quote ID: ${quoteId}`
      );
    }
  } else {
    console.log(`Unhandled event type: ${receivedEvent.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
