import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@3.2.0";
import { getAllowedCorsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const resendApiKey = Deno.env.get("RESEND_API_KEY");
const fromEmail = Deno.env.get("FROM_EMAIL") || "noreply@mail.crediteval.com";
const ordersTable = Deno.env.get("VITE_SUPABASE_ORDERS_TABLE") || "orders";

let supabaseAdmin: SupabaseClient | null = null;
if (supabaseUrl && supabaseServiceRoleKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
}

let resend: Resend | null = null;
if (resendApiKey) {
  resend = new Resend(resendApiKey);
}

serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getAllowedCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!supabaseAdmin || !resend) {
    return new Response(
      JSON.stringify({ error: "Server configuration error." }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }

  try {
    const requestBody = await req.json();
    const orderId = requestBody?.orderId ? String(requestBody.orderId) : "";
    const notes = requestBody?.notes ? String(requestBody.notes) : "";

    if (!orderId) {
      throw new Error("Missing orderId.");
    }

    const { data: orderData, error: fetchError } = await supabaseAdmin
      .from(ordersTable)
      .select("id, first_name, last_name, email, document_paths, total_amount")
      .eq("id", orderId)
      .single();

    if (fetchError || !orderData) {
      throw new Error(fetchError?.message || "Order not found.");
    }

    if (!orderData.email) {
      throw new Error("Order has no recipient email.");
    }

    const customerName = `${orderData.first_name || ""} ${
      orderData.last_name || ""
    }`.trim();

    const documentLinks = (orderData.document_paths || [])
      .map((path: string) => {
        const url = `${supabaseUrl}/storage/v1/object/public/documents/${path}`;
        return `<li><a href="${url}">${path.split("/").pop() || path}</a></li>`;
      })
      .join("");

    const amountText =
      typeof orderData.total_amount === "number"
        ? `$${(orderData.total_amount / 100).toFixed(2)}`
        : "your quoted amount";

    const html = `
      <h2>Your translation is ready for review</h2>
      <p>Hi ${customerName || "there"},</p>
      <p>Your order <strong>#${orderData.id}</strong> has been completed and is ready for review.</p>
      <p>You can review the completed document(s) below:</p>
      <ul>${documentLinks || "<li>No documents were attached.</li>"}</ul>
      <p>When you are ready, complete payment (${amountText}) to unlock final delivery and download access.</p>
      ${
        notes
          ? `<p><strong>Additional note from our team:</strong><br/>${notes}</p>`
          : ""
      }
      <p>Thanks,<br/>CreditEval Team</p>
    `;

    const { error: sendError } = await resend.emails.send({
      from: fromEmail,
      to: orderData.email,
      subject: `Your CreditEval order is ready for review (#${orderData.id})`,
      html,
    });

    if (sendError) {
      throw new Error(sendError.message);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Completion email sent." }),
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
