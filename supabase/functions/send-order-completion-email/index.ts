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
const fromEmail = "noreply@crediteval.com";
const ordersTable = Deno.env.get("VITE_SUPABASE_ORDERS_TABLE") || "orders";
const siteUrl = Deno.env.get("SITE_URL") || "https://crediteval.com";

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
    const reviewUrlOverride = requestBody?.reviewUrl
      ? String(requestBody.reviewUrl)
      : "";

    if (!orderId) {
      throw new Error("Missing orderId.");
    }

    const { data: orderData, error: fetchError } = await supabaseAdmin
      .from(ordersTable)
      .select("id, first_name, last_name, email, document_paths, total_amount, services")
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

    const services =
      orderData.services && typeof orderData.services === "object"
        ? (orderData.services as Record<string, unknown>)
        : {};
    const orderMeta =
      typeof services._meta === "object" && services._meta
        ? (services._meta as Record<string, unknown>)
        : {};
    const reviewToken =
      typeof orderMeta.reviewToken === "string"
        ? orderMeta.reviewToken
        : typeof orderMeta.editToken === "string"
        ? orderMeta.editToken
        : "";
    const computedReviewUrl = reviewToken
      ? `${siteUrl}/order-review/${orderData.id}?token=${encodeURIComponent(
          reviewToken
        )}`
      : "";
    const reviewUrl = reviewUrlOverride || computedReviewUrl;

    const documentLinks = (orderData.document_paths || [])
      .map((path: string) => {
        const url = `${supabaseUrl}/storage/v1/object/public/documents/${path}`;
        return `<li><a href="${url}">${path.split("/").pop() || path}</a></li>`;
      })
      .join("");

    const totalAmountValue =
      typeof orderData.total_amount === "number"
        ? orderData.total_amount
        : typeof orderData.total_amount === "string"
        ? Number(orderData.total_amount)
        : NaN;
    const amountText = Number.isFinite(totalAmountValue)
      ? `$${(totalAmountValue / 100).toFixed(2)}`
      : "your quoted amount";
    const serviceType =
      typeof services.type === "string"
        ? services.type.replace(/_/g, " ")
        : "translation";
    const languagePair =
      typeof services.languageFrom === "string" &&
      typeof services.languageTo === "string"
        ? `${services.languageFrom} to ${services.languageTo}`
        : "Prepared translation preview";
    const pageCount =
      typeof services.pageCount === "number" ? `${services.pageCount} page${services.pageCount === 1 ? "" : "s"}` : "Custom page count";
    const notarizationFee =
      typeof services.notarizationFee === "number"
        ? `$${(services.notarizationFee / 100).toFixed(2)}`
        : "$25.00";
    const expressMailFee =
      typeof services.expressMailFee === "number"
        ? `$${(services.expressMailFee / 100).toFixed(2)}`
        : "$15.00";
    const internationalMailFee =
      typeof services.internationalMailFee === "number"
        ? `$${(services.internationalMailFee / 100).toFixed(2)}`
        : "$45.00";

    const html = `
      <div style="margin:0;padding:32px 0;background:#eef4ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#10233f;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;margin:0 auto;">
          <tr>
            <td style="padding:0 20px;">
              <div style="background:#12335b;border-radius:28px;padding:32px 32px 22px;color:#ffffff;box-shadow:0 18px 45px rgba(16,35,63,0.18);">
                <div style="display:inline-block;padding:8px 14px;border-radius:999px;background:#1d548f;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#ffffff;">
                  CreditEval Preview Ready
                </div>
                <h1 style="margin:18px 0 10px;font-size:34px;line-height:1.1;font-weight:800;color:#ffffff;">
                  Review your watermarked translation preview
                </h1>
                <p style="margin:0;font-size:17px;line-height:1.7;color:#e8f1ff;max-width:520px;">
                  Hi ${customerName || "there"}, your order is ready. Open your private review page to preview the PDF, confirm delivery options, and unlock the final clean version when you're ready.
                </p>
              </div>

              <div style="margin-top:-18px;background:#ffffff;border-radius:28px;padding:28px;box-shadow:0 20px 45px rgba(21,49,89,0.1);">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:20px;">
                  <tr>
                    <td style="padding:0 0 18px;border-bottom:1px solid #e8eef9;">
                      <div style="font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#4f6b95;">Order Summary</div>
                      <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                        <div style="padding:16px;border-radius:18px;background:#f7faff;">
                          <div style="font-size:12px;color:#6b7f9f;text-transform:uppercase;letter-spacing:0.06em;">Order ID</div>
                          <div style="margin-top:6px;font-size:18px;font-weight:700;color:#10233f;">#${orderData.id}</div>
                        </div>
                        <div style="padding:16px;border-radius:18px;background:#f7faff;">
                          <div style="font-size:12px;color:#6b7f9f;text-transform:uppercase;letter-spacing:0.06em;">Unlock Price</div>
                          <div style="margin-top:6px;font-size:18px;font-weight:700;color:#10233f;">${amountText}</div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:22px;">
                  <tr>
                    <td style="padding:18px;border-radius:22px;background:#10233f;color:#dce9ff;">
                      <div style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9ecbff;">What's inside</div>
                      <div style="margin-top:12px;font-size:16px;line-height:1.7;">
                        <div><strong style="color:#ffffff;">Service:</strong> ${serviceType}</div>
                        <div><strong style="color:#ffffff;">Languages:</strong> ${languagePair}</div>
                        <div><strong style="color:#ffffff;">Volume:</strong> ${pageCount}</div>
                        <div><strong style="color:#ffffff;">Optional add-ons:</strong> Notarization ${notarizationFee}, domestic mail ${expressMailFee}, international mail ${internationalMailFee}</div>
                      </div>
                    </td>
                  </tr>
                </table>

                ${
                  reviewUrl
                    ? `
                <div style="margin:26px 0 22px;">
                  <div style="font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.07em;color:#4f6b95;margin-bottom:10px;">Review link</div>
                  <div style="text-align:center;margin-bottom:12px;">
                    <a href="${reviewUrl}" style="display:inline-block;padding:16px 26px;border-radius:16px;background:#0f4c81;color:#ffffff;text-decoration:none;font-size:16px;font-weight:800;box-shadow:0 14px 28px rgba(30,120,201,0.28);">
                    Review Preview And Purchase
                    </a>
                  </div>
                  <div style="padding:14px 16px;border-radius:16px;background:#f7faff;border:1px solid #dbe7f6;font-size:13px;line-height:1.6;word-break:break-all;color:#35527a;">
                    ${reviewUrl}
                  </div>
                </div>
                `
                    : ""
                }

                <div style="padding:18px;border-radius:20px;background:#f8fbff;border:1px solid #e5eef9;">
                  <div style="font-size:14px;font-weight:700;color:#10233f;margin-bottom:8px;">What happens next</div>
                  <div style="font-size:15px;line-height:1.8;color:#4d6285;">
                    1. Review the watermarked PDF on your private page.<br/>
                    2. Choose any extras like notarization or mailing.<br/>
                    3. Pay securely to unlock the final deliverable and download access.
                  </div>
                </div>

                ${
                  notes
                    ? `
                <div style="margin-top:18px;padding:18px;border-radius:20px;background:#fff7ec;border:1px solid #f6ddbc;">
                  <div style="font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.07em;color:#9a5b12;">Note from our team</div>
                  <div style="margin-top:8px;font-size:15px;line-height:1.7;color:#6c4a1b;">${notes}</div>
                </div>
                `
                    : ""
                }

                ${
                  documentLinks
                    ? `
                <div style="margin-top:18px;">
                  <div style="font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.07em;color:#4f6b95;">Attached files</div>
                  <ul style="margin:10px 0 0;padding-left:18px;color:#35527a;line-height:1.8;">
                    ${documentLinks}
                  </ul>
                </div>
                `
                    : ""
                }
              </div>

              <div style="padding:18px 10px 0;text-align:center;font-size:13px;line-height:1.7;color:#627a9d;">
                CreditEval Team<br/>
                Fast, accurate translation previews with clean final delivery after approval.
              </div>
            </td>
          </tr>
        </table>
      </div>
    `;

    const { error: sendError } = await resend.emails.send({
      from: `CreditEval <${fromEmail}>`,
      to: orderData.email,
      subject: `Your CreditEval preview is ready (#${orderData.id})`,
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
