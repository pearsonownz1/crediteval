import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@11.16.0?target=deno&deno-std=0.132.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, getAllowedCorsHeaders } from "../_shared/cors.ts";

console.log("Function starting (Quote Payment Intent version)...");

// IMPORTANT: Set these in your Supabase project's Function Environment Variables settings.
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Initialize Stripe client *once* outside the handler
const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16", // Use a recent API version
      httpClient: Stripe.createFetchHttpClient(),
    })
  : null;

// Create Supabase client configured to use service_role key *once*
const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null;

serve(async (req) => {
  const origin = req.headers.get("Origin");

  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getAllowedCorsHeaders(origin) }); // Use dynamic headers
  }

  // --- Environment Variable Check ---
  if (!stripe || !supabaseAdmin) {
    console.error(
      "Missing environment variables (Stripe or Supabase). Function cannot proceed."
    );
    return new Response(
      JSON.stringify({ error: "Server configuration error." }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
  // --- End Environment Variable Check ---

  try {
    const requestBody = await req.json();
    console.log("Received request body:", JSON.stringify(requestBody, null, 2));

    // Destructure expected parameters for Quote Payment Intent
    const {
      amount,
      quoteId, // Only expect quoteId for this function
      services, // Keep services here for logging, but make it optional in update
      currency = "usd",
      customerEmail, // Added for Checkout Session
      successUrl, // Added for Checkout Session
      cancelUrl, // Added for Checkout Session
      name, // Added for Checkout Session metadata
      service_type, // Added for Checkout Session metadata
    } = requestBody;

    console.log(`Extracted amount: ${amount} (type: ${typeof amount})`);
    console.log(`Extracted quoteId: ${quoteId} (type: ${typeof quoteId})`); // Log quoteId
    console.log(`Extracted services: `, services); // Log services to see if it's undefined
    console.log(`Extracted currency: ${currency}`);
    console.log(`Extracted customerEmail: ${customerEmail}`);
    console.log(`Extracted successUrl: ${successUrl}`);
    console.log(`Extracted cancelUrl: ${cancelUrl}`);
    console.log(`Extracted name: ${name}`);
    console.log(`Extracted service_type: ${service_type}`);

    // --- Input Validation ---
    if (!amount || typeof amount !== "number" || amount < 50) {
      // Amount is expected in cents
      console.error("Amount validation failed:", amount);
      throw new Error(
        "Invalid or missing amount provided (must be at least 50 cents)."
      );
    }
    if (!quoteId || typeof quoteId !== "string") {
      console.error("Quote ID validation failed: Invalid type.", quoteId);
      throw new Error("Invalid or missing quoteId.");
    }
    if (!customerEmail || typeof customerEmail !== "string") {
      console.error("Customer Email validation failed:", customerEmail);
      throw new Error("Missing or invalid customerEmail.");
    }
    if (!successUrl || typeof successUrl !== "string") {
      console.error("Success URL validation failed:", successUrl);
      throw new Error("Missing or invalid successUrl.");
    }
    if (!cancelUrl || typeof cancelUrl !== "string") {
      console.error("Cancel URL validation failed:", cancelUrl);
      throw new Error("Missing or invalid cancelUrl.");
    }
    // --- End Input Validation ---

    const targetId = quoteId; // For quotes, targetId is always quoteId
    const targetType = "quote";

    console.log(
      `Validation passed. Creating Checkout Session for ${targetType} ${targetId} with amount ${amount}`
    );

    // --- Check if Quote Exists and Get Details (Optional but Recommended) ---
    // You might want to fetch the quote from Supabase here to confirm the amount
    // and ensure the quote exists before creating the Checkout Session.
    // const { data: quoteData, error: quoteError } = await supabaseAdmin
    //   .from('quotes')
    //   .select('price, status') // Select relevant fields
    //   .eq('id', quoteId)
    //   .single();
    //
    // if (quoteError || !quoteData) {
    //   console.error(`Quote ${quoteId} not found or error fetching:`, quoteError);
    //   throw new Error(`Quote ${quoteId} not found.`);
    // }
    //
    // // Optional: Verify amount matches the quote record
    // if (quoteData.price * 100 !== amount) {
    //    console.warn(`Amount mismatch for quote ${quoteId}. Request: ${amount}, DB: ${quoteData.price * 100}. Proceeding with requested amount.`);
    //    // Decide how to handle mismatch - throw error or proceed?
    // }
    //
    // if (quoteData.status === 'Paid') { // Prevent paying for already paid quote
    //    console.error(`Quote ${quoteId} has already been paid.`);
    //    throw new Error(`Quote ${quoteId} has already been paid.`);
    // }
    // --- End Quote Check ---

    // Create a Stripe Checkout Session
    let session;
    try {
      const checkoutSessionParams: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: currency,
              product_data: {
                name: `Quote for ${name || "Services"}`, // Use name from metadata or generic
                description: `Service Type: ${service_type || "N/A"}`, // Use service_type from metadata or generic
                metadata: {
                  quote_id: quoteId,
                },
              },
              unit_amount: amount, // Amount in cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: customerEmail,
        metadata: {
          quote_id: quoteId, // Add quote_id to session metadata
        },
      };

      console.log(
        "Creating Checkout Session with params:",
        checkoutSessionParams
      );
      session = await stripe.checkout.sessions.create(checkoutSessionParams);

      console.log(
        `Stripe Checkout Session ${session.id} created for ${targetType} ${targetId}.`
      );
    } catch (stripeError: any) {
      console.error(`Stripe Checkout Session creation failed:`, stripeError);
      throw new Error(
        `Stripe Checkout Session creation failed: ${stripeError.message}`
      );
    }

    // IMPORTANT: Do NOT update the database here.
    // The database update (e.g., setting status to 'Paid' and storing session ID)
    // should happen in a Stripe Webhook handler (e.g., for 'checkout.session.completed' event).
    // This ensures the database is updated only after successful payment.

    // Log the session ID before returning
    console.log(`Returning sessionId for Checkout Session ${session.id}`);

    // Return the session ID
    return new Response(
      JSON.stringify({ sessionId: session.id }), // Return the session ID
      {
        headers: {
          ...getAllowedCorsHeaders(origin),
          "Content-Type": "application/json",
        }, // Use dynamic headers
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing quote payment intent request:", error);
    // Check if it's a Stripe error object
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error.";
    const errorStatus = (error as any).type === "StripeCardError" ? 400 : 500; // Use 400 for card errors

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: {
        ...getAllowedCorsHeaders(origin),
        "Content-Type": "application/json",
      }, // Use dynamic headers
      status: errorStatus,
    });
  }
});

console.log("Function handler registered (Quote Payment Intent version).");
