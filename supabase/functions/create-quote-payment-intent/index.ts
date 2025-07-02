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
      quoteId, // Expect quoteId for this function
      currency = "usd",
    } = requestBody;

    console.log(`Extracted amount: ${amount} (type: ${typeof amount})`);
    console.log(`Extracted quoteId: ${quoteId} (type: ${typeof quoteId})`);
    console.log(`Extracted currency: ${currency}`);

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
    // --- End Input Validation ---

    console.log(
      `Validation passed. Creating Payment Intent for quote ${quoteId} with amount ${amount}`
    );

    // --- Check if Quote Exists and Get Details (Recommended) ---
    const { data: quoteData, error: quoteError } = await supabaseAdmin
      .from(Deno.env.get("VITE_SUPABASE_ORDERS_TABLE"))
      .select("price, status, email, first_name, last_name") // Select relevant fields
      .eq("id", quoteId)
      .single();

    if (quoteError || !quoteData) {
      console.error(
        `Quote ${quoteId} not found or error fetching:`,
        quoteError
      );
      throw new Error(`Quote ${quoteId} not found.`);
    }

    // Verify amount matches the quote record
    if (quoteData.price * 100 !== amount) {
      console.warn(
        `Amount mismatch for quote ${quoteId}. Request: ${amount}, DB: ${
          quoteData.price * 100
        }. Proceeding with requested amount.`
      );
      // Decide how to handle mismatch - throw error or proceed?
    }

    if (quoteData.status === "Paid") {
      // Prevent paying for already paid quote
      console.error(`Quote ${quoteId} has already been paid.`);
      throw new Error(`Quote ${quoteId} has already been paid.`);
    }
    // --- End Quote Check ---

    // Create a Stripe Payment Intent
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: amount, // Amount in cents
        currency: currency,
        metadata: {
          quote_id: quoteId,
          customer_email: quoteData.email,
          customer_name: `${quoteData.first_name} ${quoteData.last_name}`,
        },
      });

      console.log(
        `Stripe Payment Intent ${paymentIntent.id} created for quote ${quoteId}.`
      );
    } catch (stripeError: any) {
      console.error(`Stripe Payment Intent creation failed:`, stripeError);
      throw new Error(
        `Stripe Payment Intent creation failed: ${stripeError.message}`
      );
    }

    // Update the quote with the payment intent ID
    const { error: updateError } = await supabaseAdmin
      .from(Deno.env.get("VITE_SUPABASE_ORDERS_TABLE"))
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        status: "pending_payment", // Set status to pending payment
      })
      .eq("id", quoteId);

    if (updateError) {
      console.error(
        `Failed to update quote ${quoteId} with payment intent ID:`,
        updateError
      );
      throw new Error(
        `Failed to update quote with payment intent ID: ${updateError.message}`
      );
    }

    // Return the client secret
    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      {
        headers: {
          ...getAllowedCorsHeaders(origin),
          "Content-Type": "application/json",
        },
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
