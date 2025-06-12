import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAllowedCorsHeaders } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_API_URL = "https://api.resend.com/emails";

const FROM_EMAIL = "noreply@mail.crediteval.com";

console.log("send-quote-payment-link-email function initialized");

serve(async (req) => {
  const requestOrigin = req.headers.get("Origin");
  const corsHeaders = getAllowedCorsHeaders(requestOrigin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { quoteId, clientEmail, clientName, quotePaymentUrl } =
      await req.json();
    console.log("Received data for payment link email:", {
      quoteId,
      clientEmail,
      clientName,
      quotePaymentUrl,
    });

    if (!quoteId || !clientEmail || !clientName || !quotePaymentUrl) {
      throw new Error(
        "Missing required details (quoteId, clientEmail, clientName, quotePaymentUrl) in request body."
      );
    }

    const subject = `Your Quote Payment Link from CreditEval.com (#${quoteId.substring(
      0,
      8
    )})`;

    const emailBodyHtml = `
      <h1>Your Quote Payment Link from CreditEval</h1>
      <p>Hello ${clientName},</p>
      <p>Your quote is ready! To complete your payment and proceed with your service, please click the link below:</p>
      <p><a href="${quotePaymentUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Pay for Your Quote</a></p>
      <p>Or copy and paste this link into your browser: ${quotePaymentUrl}</p>
      <p>If you have any questions, please contact us.</p>
      <p>Thank you,<br>The CreditEval Team</p>
    `;

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not set in environment variables.");
      return new Response(
        JSON.stringify({
          error: "Email sending configuration error on server.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const emailPayload = {
      from: FROM_EMAIL,
      to: [clientEmail],
      subject: subject,
      html: emailBodyHtml,
    };

    console.log(
      `Attempting to send email via Resend to ${clientEmail} with payload:`,
      JSON.stringify(emailPayload, null, 2)
    );
    const resendResponse = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend API Error:", resendData);
      throw new Error(
        `Failed to send email: ${
          resendData.message || resendResponse.statusText
        }`
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Quote payment link email sent successfully!",
        emailId: resendData.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
