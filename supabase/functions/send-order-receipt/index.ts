import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@3.2.0"; // Import Resend
import { getAllowedCorsHeaders } from "../_shared/cors.ts";

console.log("Send Order Receipt function starting...");

// --- Environment Variables ---
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const resendApiKey = Deno.env.get("RESEND_API_KEY"); // Get Resend API Key
const fromEmail = "noreply@mail.crediteval.com"; // Your verified Resend domain email

// --- Initialize Clients ---
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

  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // --- Check Initialization ---
  if (!supabaseAdmin || !resend) {
    console.error("Missing environment variables (Supabase or Resend). Function cannot proceed.");
    return new Response(JSON.stringify({ error: "Server configuration error." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  try {
    const { orderId } = await req.json();

    if (!orderId || typeof orderId !== 'string') {
      throw new Error("Invalid or missing orderId provided.");
    }

    console.log(`Fetching details for order ID: ${orderId}`);

    // --- Fetch Order Details ---
    const { data: orderData, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, first_name, last_name, email, services, total_amount, created_at') // Adjust columns as needed
      .eq('id', orderId)
      .single();

    if (fetchError || !orderData) {
      console.error(`Error fetching order ${orderId}:`, fetchError);
      throw new Error(`Order not found or failed to fetch: ${fetchError?.message || 'No data'}`);
    }

    console.log(`Order details fetched for ${orderData.email}`);

    // --- Construct Email Content (Basic Example) ---
    // You'll likely want to create a more detailed HTML template
    const customerName = `${orderData.first_name || ''} ${orderData.last_name || ''}`.trim();
    const subject = `Your CreditEval Order Receipt (#${orderData.id})`;
    const bodyText = `
      Hi ${customerName || 'Customer'},

      Thank you for your order with CreditEval!

      Order ID: ${orderData.id}
      Date: ${new Date(orderData.created_at).toLocaleDateString()}
      Amount Paid: $${(orderData.total_amount / 100).toFixed(2)} 

      We've received your payment and your order is being processed.

      Thanks,
      The CreditEval Team
    `;
    // Consider an HTML version for better formatting:
    // const bodyHtml = `<strong>Hi ${customerName || 'Customer'}</strong>, <p>Thank you...</p>`;

    // --- Send Email via Resend ---
    console.log(`Sending receipt email to ${orderData.email}`);
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: `CreditEval <${fromEmail}>`,
      to: [orderData.email], // Send to customer's email
      cc: ["support@gcs.org", "guy@gcs.org"], // CC internal addresses
      subject: subject,
      text: bodyText, // Use text version
      // html: bodyHtml, // Optionally add HTML version
    });

    if (emailError) {
      console.error(`Resend error sending email for order ${orderId}:`, emailError);
      // Log the error but maybe don't fail the whole function call?
      // Or return a specific error indicating email failure.
      // For now, we'll return success but log the error.
      // throw new Error(`Failed to send receipt email: ${emailError.message}`);
    } else {
      console.log(`Receipt email sent successfully for order ${orderId}. Email ID: ${emailData?.id}`);
    }

    // --- Respond Success ---
    return new Response(
      JSON.stringify({ success: true, message: "Receipt email processed." }), // Indicate processed, even if email had an error logged
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error processing send-order-receipt request:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: error.message.includes("Order not found") ? 404 : (error.message.includes("Invalid or missing") ? 400 : 500),
    });
  }
});

console.log("Send Order Receipt function handler registered.");
