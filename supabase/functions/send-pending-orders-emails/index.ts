import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
    });
  }
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );
  const { data: orders, error } = await supabaseClient
    .from(Deno.env.get("VITE_SUPABASE_ORDERS_TABLE"))
    .select("*")
    .gt("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Orders created in the last hour
    .eq("status", "pending");
  if (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 400,
      }
    );
  }
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const resendUrl = "https://api.resend.com/emails";
  for (const order of orders) {
    const emailData = {
      from: "noreply@mail.crediteval.com",
      to: order.customer_email,
      subject: "Your Order is Pending",
      html: `<p>Dear Customer,</p><p>Your order with ID <strong>${order.id}</strong> is currently pending. Please check your account for more details.</p>`,
    };
    const response = await fetch(resendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailData),
    });
    if (!response.ok) {
      const errorResponse = await response.json();
      console.error("Error sending email:", errorResponse);
    }
  }
  return new Response(
    JSON.stringify({
      message: "Emails sent successfully!",
    }),
    {
      status: 200,
    }
  );
});
