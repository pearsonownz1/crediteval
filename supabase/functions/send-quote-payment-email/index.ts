import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.0";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { quoteId, paymentIntentId } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch quote details
    const { data: quote, error: quoteError } = await supabaseClient
      .from("quotes")
      .select("*")
      .eq("id", quoteId)
      .single();

    if (quoteError || !quote) {
      console.error("Error fetching quote:", quoteError?.message);
      return new Response(JSON.stringify({ error: "Quote not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    const emailSubject = `New Quote Payment Received: Quote #${quote.id}`;
    const emailBody = `
      A new payment has been successfully processed for Quote #${quote.id}.

      Quote Details:
      - Quote ID: ${quote.id}
      - Service Type: ${quote.service_type}
      ${
        quote.services?.delivery ? `- Delivery: ${quote.services.delivery}` : ""
      }
      ${quote.services?.urgency ? `- Urgency: ${quote.services.urgency}` : ""}
      ${
        quote.service_type === "Certified Translation" &&
        quote.services?.language_from
          ? `- Language From: ${quote.services.language_from}`
          : ""
      }
      ${
        quote.service_type === "Certified Translation" &&
        quote.services?.language_to
          ? `- Language To: ${quote.services.language_to}`
          : ""
      }
      ${
        quote.service_type === "Certified Translation" &&
        quote.services?.total_page
          ? `- Total Page: ${quote.services.total_page}`
          : ""
      }
      - Amount Paid: $${quote.price.toFixed(2)}
      - Payment Intent ID: ${paymentIntentId}
      - Customer Email: ${quote.email || "N/A"}
      - Customer Name: ${quote.name || "N/A"}
      - Status: ${quote.status}

      Please log in to the admin dashboard for more details.
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      },
      body: JSON.stringify({
        from: "CreditEval <no-reply@mail.crediteval.com>",
        to: ["support@crediteval.com"],
        subject: emailSubject,
        html: emailBody.replace(/\n/g, "<br>"), // Convert newlines to HTML breaks
      }),
    });

    const data = await res.json();

    if (res.ok) {
      return new Response(JSON.stringify({ message: "Email sent", data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      console.error("Resend API error:", data);
      return new Response(
        JSON.stringify({ error: data.message || "Failed to send email" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: res.status,
        }
      );
    }
  } catch (error) {
    console.error("Function error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
