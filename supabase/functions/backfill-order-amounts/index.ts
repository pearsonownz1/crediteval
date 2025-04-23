import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@11.16.0?target=deno&deno-std=0.132.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAllowedCorsHeaders } from "../_shared/cors.ts"; // Assuming shared CORS logic

console.log("Backfill Order Amounts function starting...");

// IMPORTANT: Ensure these are set in Function Environment Variables
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Initialize Stripe client *once*
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
}) : null;

// Create Supabase client configured to use service_role key *once*
const supabaseAdmin = (supabaseUrl && supabaseServiceRoleKey)
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null;

// Simple secret check for manual invocation (replace 'YOUR_SECRET_KEY' or use a more robust method)
const RUN_SECRET = Deno.env.get("BACKFILL_SECRET") || "default-secret-change-me";

serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getAllowedCorsHeaders(origin);

  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // --- Environment Variable Check ---
  if (!stripe || !supabaseAdmin) {
      console.error("Missing environment variables (Stripe or Supabase). Function cannot proceed.");
      return new Response(JSON.stringify({ error: "Server configuration error." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
  }
  // --- End Environment Variable Check ---

  // --- Security Check for Manual Run ---
  // Check for a specific header or query parameter to prevent accidental runs
  const runParam = new URL(req.url).searchParams.get("run_secret");
  if (runParam !== RUN_SECRET) {
      console.warn("Attempted run without correct secret.");
      return new Response(JSON.stringify({ error: "Unauthorized." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
  }
  // --- End Security Check ---


  console.log("Backfill function invoked with correct secret. Starting process...");
  let updatedCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  try {
    // 1. Fetch orders needing backfill
    const { data: ordersToUpdate, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, stripe_payment_intent_id')
      .is('total_amount', null) // Where total_amount IS NULL
      .not('stripe_payment_intent_id', 'is', null); // And payment intent ID IS NOT NULL

    if (fetchError) {
      console.error("Error fetching orders for backfill:", fetchError);
      throw new Error(`Failed to fetch orders: ${fetchError.message}`);
    }

    if (!ordersToUpdate || ordersToUpdate.length === 0) {
      console.log("No orders found needing amount backfill.");
      return new Response(JSON.stringify({ message: "No orders found needing amount backfill." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log(`Found ${ordersToUpdate.length} orders to process.`);

    // 2. Iterate and update each order
    for (const order of ordersToUpdate) {
      if (!order.stripe_payment_intent_id) {
        console.warn(`Skipping order ${order.id} due to missing payment intent ID (should not happen based on query).`);
        failedCount++;
        errors.push(`Order ${order.id}: Missing payment intent ID.`);
        continue;
      }

      try {
        console.log(`Processing order ${order.id}, PI: ${order.stripe_payment_intent_id}`);

        // 3. Fetch PaymentIntent from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id);

        if (!paymentIntent || typeof paymentIntent.amount !== 'number') {
          throw new Error(`Could not retrieve valid amount from Stripe for PI ${order.stripe_payment_intent_id}`);
        }

        const amountInCents = paymentIntent.amount;
        console.log(`Retrieved amount ${amountInCents} for order ${order.id}`);

        // 4. Update Supabase order
        const { error: updateError } = await supabaseAdmin
          .from('orders')
          .update({ total_amount: amountInCents })
          .eq('id', order.id);

        if (updateError) {
          throw new Error(`Supabase update failed: ${updateError.message}`);
        }

        console.log(`Successfully updated total_amount for order ${order.id} to ${amountInCents}`);
        updatedCount++;

      } catch (processError: any) {
        console.error(`Failed to process order ${order.id} (PI: ${order.stripe_payment_intent_id}):`, processError.message);
        failedCount++;
        errors.push(`Order ${order.id}: ${processError.message}`);
        // Continue to the next order even if one fails
      }
    } // End for loop

    console.log(`Backfill complete. Updated: ${updatedCount}, Failed: ${failedCount}`);

    return new Response(
      JSON.stringify({
        message: "Backfill process completed.",
        updated: updatedCount,
        failed: failedCount,
        errors: errors, // Include specific errors in response
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("General error during backfill process:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error during backfill." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

console.log("Backfill Order Amounts function handler registered.");
