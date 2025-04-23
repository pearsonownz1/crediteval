import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@11.16.0?target=deno&deno-std=0.132.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAllowedCorsHeaders } from "../_shared/cors.ts";

console.log("Get Order Details for GA function starting...");

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

  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get("orderId");

    if (!orderId) {
      throw new Error("Missing 'orderId' query parameter.");
    }

    console.log(`Fetching details for orderId: ${orderId}`);

    // 1. Fetch order details from Supabase
    const { data: orderData, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, total_amount, stripe_payment_intent_id, services') // Fetch necessary fields
      .eq('id', orderId)
      .single(); // Expect only one order

    if (fetchError) {
      console.error(`Error fetching order ${orderId} from Supabase:`, fetchError);
      throw new Error(`Order not found or database error: ${fetchError.message}`);
    }

    if (!orderData) {
        throw new Error(`Order with ID ${orderId} not found.`);
    }

    // Basic validation
    if (typeof orderData.total_amount !== 'number' || !orderData.stripe_payment_intent_id) {
        console.warn(`Order ${orderId} is missing total_amount or payment intent ID. Cannot generate GA data.`);
        throw new Error(`Order ${orderId} data is incomplete.`);
    }

    // 2. Fetch Payment Intent from Stripe to get currency
    console.log(`Fetching Payment Intent ${orderData.stripe_payment_intent_id} from Stripe.`);
    const paymentIntent = await stripe.paymentIntents.retrieve(orderData.stripe_payment_intent_id);

    if (!paymentIntent || !paymentIntent.currency) {
        throw new Error(`Could not retrieve valid currency from Stripe for PI ${orderData.stripe_payment_intent_id}`);
    }

    const currency = paymentIntent.currency.toUpperCase();
    const value = orderData.total_amount / 100; // Convert cents to dollars/euros etc.

    // 3. Construct simplified 'items' array
    // For now, create a single item representing the service type.
    // More complex logic could parse the 'services' JSONB if needed.
    let itemName = "Service Order"; // Default item name
    if (orderData.services && typeof orderData.services === 'object' && orderData.services.type) {
        switch (orderData.services.type) {
            case 'translation': itemName = 'Document Translation Service'; break;
            case 'evaluation': itemName = 'Credential Evaluation Service'; break;
            case 'expert': itemName = 'Expert Opinion Letter Service'; break;
            // Add other cases if necessary
        }
    }

    const items = [{
        item_id: orderData.services?.type || 'general_service', // Use service type or default
        item_name: itemName,
        quantity: 1,
        price: value // Price for the single item is the total value
    }];

    // 4. Prepare response data for GA4
    const ga4Data = {
      transaction_id: orderData.id,
      affiliation: 'crediteval.com', // Or your actual domain/affiliation
      value: value,
      currency: currency,
      items: items
    };

    console.log(`Successfully prepared GA4 data for order ${orderId}:`, ga4Data);

    return new Response(
      JSON.stringify(ga4Data),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error processing get-order-details-for-ga request:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: error.message.includes("not found") ? 404 : 500,
    });
  }
});

console.log("Get Order Details for GA function handler registered.");
