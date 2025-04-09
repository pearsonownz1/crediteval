import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@11.16.0?target=deno&deno-std=0.132.0"; // Revert to esm.sh import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"; // Use esm.sh for Supabase client
import { getAllowedCorsHeaders } from "../_shared/cors.ts";

console.log("Function starting...");

// IMPORTANT: Set these in your Supabase project's Function Environment Variables settings.
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Initialize Stripe client *once* outside the handler
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16", // Use a recent API version
  httpClient: Stripe.createFetchHttpClient(),
}) : null;

// Create Supabase client configured to use service_role key *once*
const supabaseAdmin = (supabaseUrl && supabaseServiceRoleKey)
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null;

serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getAllowedCorsHeaders(origin); // Use consistent name

  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // --- Environment Variable Check ---
  // Check inside the handler if clients are initialized
  if (!stripe || !supabaseAdmin) {
      console.error("Missing environment variables (Stripe or Supabase). Function cannot proceed.");
      return new Response(JSON.stringify({ error: "Server configuration error." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
  }
  // --- End Environment Variable Check ---

  try {
    const requestBody = await req.json();
    console.log("Received request body:", JSON.stringify(requestBody, null, 2)); // Log the entire body

    const { amount, orderId } = requestBody; // Destructure after logging
    console.log(`Extracted amount: ${amount} (type: ${typeof amount})`);
    console.log(`Extracted orderId: ${orderId} (type: ${typeof orderId})`); // Log extracted orderId and its type

    if (!amount || typeof amount !== 'number' || amount < 50) { // Minimum amount check (e.g., 50 cents)
        console.error("Amount validation failed:", amount);
        throw new Error("Invalid or missing amount provided (must be at least 50 cents).");
    }

    // --- Relaxed orderId check and potential conversion ---
    if (!orderId) {
        console.error("orderId validation failed: Missing orderId");
        throw new Error("Missing orderId provided.");
    }

    let orderIdString: string;
    if (typeof orderId === 'number') {
        console.log("Received orderId as number, converting to string.");
        orderIdString = String(orderId);
    } else if (typeof orderId === 'string') {
        orderIdString = orderId;
    } else {
        console.error(`orderId validation failed: Invalid type - ${typeof orderId}`);
        throw new Error(`Invalid orderId type provided: ${typeof orderId}`);
    }
    // --- End relaxed check ---

    console.log(`Validation passed. Processing request for order ${orderIdString} with amount ${amount}`);

    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount should be in the smallest currency unit (e.g., cents for USD)
      currency: "usd", // Change to your desired currency
      automatic_payment_methods: {
        enabled: true, // Let Stripe handle payment method types
      },
      // Optionally add metadata like order_id
      metadata: {
        order_id: orderIdString, // Use converted string
      },
    });

    console.log(`PaymentIntent ${paymentIntent.id} created for order ${orderIdString}.`);

    // --- Update Order Status using Service Role ---
    // This happens *before* returning the client secret. If this fails,
    // the payment might still succeed on Stripe, but the order status won't reflect it initially.
    // A webhook is the robust way to handle the final 'paid' status.
    try {
      const { error: updateError } = await supabaseAdmin
        .from('orders')
        .update({
          status: 'pending_payment', // Indicate payment initiated
          stripe_payment_intent_id: paymentIntent.id,
        })
        .eq('id', orderIdString) // Use converted string
        .select('id') // Select something to confirm update
        .single(); // Ensure it targets one row

      if (updateError) {
        // Log the error but don't fail the request, as payment can still proceed
        console.error(`Failed to update order ${orderIdString} status after PI creation:`, updateError);
        // Consider adding specific logging or monitoring here
      } else {
        console.log(`Order ${orderIdString} status updated to 'pending_payment' and PI ID stored.`);
      }
    } catch (dbError) {
      console.error(`Database exception updating order ${orderIdString} status:`, dbError);
    }
    // --- End Update Order Status ---

    // Return the client_secret
    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing payment intent request:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      // Use 500 for server-side errors, 400 for bad client input (already handled)
      status: error.type === 'StripeCardError' ? 400 : 500,
    });
  }
});

console.log("Function handler registered.");
