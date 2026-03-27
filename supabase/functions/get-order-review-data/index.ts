import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAllowedCorsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const ordersTable = Deno.env.get("VITE_SUPABASE_ORDERS_TABLE") || "orders";

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
    return new Response(
      JSON.stringify({ error: "Server configuration error." }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }

  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get("orderId") || "";
    const token = url.searchParams.get("token") || "";

    if (!orderId || !token) {
      throw new Error("Missing orderId or token.");
    }

    const { data: order, error } = await supabaseAdmin
      .from(ordersTable)
      .select(
        "id, first_name, last_name, email, status, total_amount, services, created_at, document_paths"
      )
      .eq("id", orderId)
      .single();

    if (error || !order) {
      throw new Error(error?.message || "Order not found.");
    }

    const services =
      order.services && typeof order.services === "object"
        ? (order.services as Record<string, unknown>)
        : {};
    const meta =
      typeof services._meta === "object" && services._meta
        ? (services._meta as Record<string, unknown>)
        : {};

    if (meta.reviewToken !== token && meta.editToken !== token) {
      return new Response(JSON.stringify({ error: "Invalid review token." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const previewFilePath =
      typeof services.previewFilePath === "string"
        ? services.previewFilePath
        : "";
    const finalFilePath =
      typeof services.finalFilePath === "string" ? services.finalFilePath : "";

    const signedPreviewUrl = previewFilePath
      ? (
          await supabaseAdmin.storage
            .from("documents")
            .createSignedUrl(previewFilePath, 60 * 60)
        ).data?.signedUrl || ""
      : "";
    const signedFinalUrl = finalFilePath
      ? (
          await supabaseAdmin.storage
            .from("documents")
            .createSignedUrl(finalFilePath, 60 * 60)
        ).data?.signedUrl || ""
      : "";

    return new Response(
      JSON.stringify({
        order: {
          id: order.id,
          first_name: order.first_name,
          last_name: order.last_name,
          email: order.email,
          status: order.status,
          total_amount: order.total_amount,
          services: order.services,
          created_at: order.created_at,
        },
        previewUrl: signedPreviewUrl,
        finalUrl: signedFinalUrl,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
