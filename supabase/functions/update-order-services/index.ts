import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAllowedCorsHeaders } from "../_shared/cors.ts";

console.log("Update Order Services function starting...");

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null;

serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getAllowedCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!supabaseAdmin) {
    console.error(
      "Missing Supabase environment variables. Function cannot proceed."
    );
    return new Response(
      JSON.stringify({ error: "Server configuration error." }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }

  try {
    const { orderId, services } = await req.json();

    if (!orderId || typeof orderId !== "string") {
      throw new Error("Invalid or missing orderId provided.");
    }
    if (!services || typeof services !== "object") {
      throw new Error("Invalid or missing services data provided.");
    }

    console.log(`Processing request to update services for order ${orderId}`);

    const { error: updateError } = await supabaseAdmin
      .from(Deno.env.get("VITE_SUPABASE_ORDERS_TABLE"))
      .update({ services: services })
      .eq("id", orderId);

    if (updateError) {
      console.error(
        `Error updating services for order ${orderId}:`,
        updateError
      );
      throw new Error(
        `Failed to update order services: ${updateError.message}`
      );
    }

    console.log(`Successfully updated services for order ${orderId}.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Order services updated successfully.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing update-order-services request:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error." }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: error.message.startsWith("Failed to fetch")
          ? 404
          : error.message.startsWith("Invalid or missing")
          ? 400
          : 500,
      }
    );
  }
});

console.log("Update Order Services function handler registered.");
