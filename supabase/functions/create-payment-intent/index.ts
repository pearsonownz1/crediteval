import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@11.16.0?target=deno&deno-std=0.132.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, getAllowedCorsHeaders } from "../_shared/cors.ts";

console.log("Function starting (Payment Intent version)...");

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

    // Destructure expected parameters for Payment Intent
    const { amount, orderId, services, currency = "usd" } = requestBody; // Expect orderId now

    console.log(`Extracted amount: ${amount} (type: ${typeof amount})`);
    console.log(`Extracted orderId: ${orderId} (type: ${typeof orderId})`); // Log orderId
    console.log(`Extracted services: `, services);
    console.log(`Extracted currency: ${currency}`);

    // --- Input Validation ---
    if (!amount || typeof amount !== "number" || amount < 50) {
      // Amount is expected in cents
      console.error("Amount validation failed:", amount);
      throw new Error(
        "Invalid or missing amount provided (must be at least 50 cents)."
      );
    }
    if (!orderId || typeof orderId !== "string") {
      // Validate orderId
      console.error("Order ID validation failed:", orderId);
      throw new Error("Invalid or missing orderId.");
    }
    // --- End Input Validation ---

    console.log(
      `Validation passed. Creating Payment Intent for order ${orderId} with amount ${amount}`
    );

    // --- Check if Order Exists and Get Details (Optional but Recommended) ---
    // You might want to fetch the order from Supabase here to confirm the amount
    // and ensure the order exists before creating the Payment Intent.
    // const { data: orderData, error: orderError } = await supabaseAdmin
    //   .from('orders')
    //   .select('total_amount, status') // Select relevant fields
    //   .eq('id', orderId)
    //   .single();
    //
    // if (orderError || !orderData) {
    //   console.error(`Order ${orderId} not found or error fetching:`, orderError);
    //   throw new Error(`Order ${orderId} not found.`);
    // }
    //
    // // Optional: Verify amount matches the order record
    // if (orderData.total_amount !== amount) {
    //    console.warn(`Amount mismatch for order ${orderId}. Request: ${amount}, DB: ${orderData.total_amount}. Proceeding with requested amount.`);
    //    // Decide how to handle mismatch - throw error or proceed?
    // }
    //
    // if (orderData.status === 'paid') { // Prevent paying for already paid order
    //    console.error(`Order ${orderId} has already been paid.`);
    //    throw new Error(`Order ${orderId} has already been paid.`);
    // }
    // --- End Order Check ---

    // Create a Stripe Payment Intent
    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: amount, // Amount in cents
      currency: currency,
      metadata: {
        order_id: orderId, // Add order_id to metadata
        quote_id: orderId, // Add quote_id using the orderId value
        // Add any other relevant metadata you might need
      },
      // You might need 'automatic_payment_methods': { enabled: true } depending on your Stripe setup
      // Or specify payment_method_types: ['card']
      payment_method_types: ["card"],
      // Consider adding customer ID if you manage Stripe customers:
      // customer: stripeCustomerId,
      // description: `Payment for Order ID: ${orderId}`, // Optional description
    };

    console.log("Creating Payment Intent with params:", paymentIntentParams);
    const paymentIntent = await stripe.paymentIntents.create(
      paymentIntentParams
    );

    console.log(
      `Stripe Payment Intent ${paymentIntent.id} created for order ${orderId}.`
    );

    // --- Update Order Status/Payment Intent ID using Service Role (Optional but Recommended) ---
    // Store the paymentIntent.id in your order table for reconciliation
    try {
      console.log(
        `Attempting to update order ID: ${orderId} with payment intent ID: ${paymentIntent.id}`
      );
      const { error: updateError } = await supabaseAdmin
        .from("orders") // Assuming you store this in the 'orders' table
        .update({
          stripe_payment_intent_id: paymentIntent.id, // Store the Payment Intent ID
          status: "pending_payment", // Update status as payment is initiated
          total_amount: amount, // Ensure total_amount is stored/updated correctly
          services: services, // Assuming 'services' column is JSONB
        })
        .eq("id", orderId);

      if (updateError) {
        console.error(
          `DB UPDATE FAILED for order ${orderId}. Error:`,
          JSON.stringify(updateError, null, 2)
        );
        // Log the error but don't fail the request, as the clientSecret is the priority here
      } else {
        console.log(
          `DB UPDATE SUCCEEDED for order ${orderId}. Stored payment intent ID and updated status/amount.`
        );
      }
    } catch (dbError) {
      console.error(`Database exception updating order ${orderId}:`, dbError);
    }
    // --- End Update Order Status ---

    // Log the client secret before returning
    console.log(
      `Returning clientSecret for Payment Intent ${paymentIntent.id}`
    );

    // Return the client secret
    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }), // Return the client secret
      {
        headers: {
          ...getAllowedCorsHeaders(origin),
          "Content-Type": "application/json",
        }, // Use dynamic headers
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing payment intent request:", error);
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

console.log("Function handler registered (Payment Intent version).");
