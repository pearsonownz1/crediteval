import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAllowedCorsHeaders } from "../_shared/cors.ts"; // Assuming shared CORS logic

console.log("Update Order Documents function starting...");

// IMPORTANT: Set these in your Supabase project's Function Environment Variables settings.
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

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
  if (!supabaseAdmin) {
      console.error("Missing Supabase environment variables. Function cannot proceed.");
      return new Response(JSON.stringify({ error: "Server configuration error." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
  }
  // --- End Environment Variable Check ---

  try {
    const { orderId, documentPath } = await req.json();

    if (!orderId || typeof orderId !== 'string') {
        throw new Error("Invalid or missing orderId provided.");
    }
    if (!documentPath || typeof documentPath !== 'string') {
        throw new Error("Invalid or missing documentPath provided.");
    }

    console.log(`Processing request to add document path '${documentPath}' to order ${orderId}`);

    // --- Fetch current paths and Update using Service Role ---
    // 1. Fetch current paths
    const { data: orderData, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('document_paths')
      .eq('id', orderId)
      .single();

    if (fetchError) {
        console.error(`Error fetching order ${orderId} for document update:`, fetchError);
        throw new Error(`Failed to fetch order details: ${fetchError.message}`);
    }

    // 2. Append new path (handle null or existing array)
    const currentPaths = orderData?.document_paths || [];
    // Avoid adding duplicates if the function is somehow called twice for the same path
    const updatedPaths = currentPaths.includes(documentPath) ? currentPaths : [...currentPaths, documentPath];

    // 3. Update the order record
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ document_paths: updatedPaths })
      .eq('id', orderId);

    if (updateError) {
        console.error(`Error updating document_paths for order ${orderId}:`, updateError);
        throw new Error(`Failed to update order documents: ${updateError.message}`);
    }
    // --- End Update ---

    console.log(`Successfully added document path '${documentPath}' to order ${orderId}.`);

    return new Response(
      JSON.stringify({ success: true, message: "Document path added successfully." }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing update-order-documents request:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: error.message.startsWith("Failed to fetch") ? 404 : (error.message.startsWith("Invalid or missing") ? 400 : 500),
    });
  }
});

console.log("Update Order Documents function handler registered.");
