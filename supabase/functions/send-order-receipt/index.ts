import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";
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
    console.error(
      "Missing environment variables (Supabase or Resend). Function cannot proceed."
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
    console.log("[Debug] Attempting to parse request body..."); // Log before parsing
    let requestBody;
    try {
      requestBody = await req.json(); // Parse the body first
      console.log(
        "[Debug] Successfully parsed request body:",
        JSON.stringify(requestBody, null, 2)
      ); // Log the parsed body
    } catch (parseError) {
      console.error("[Critical] Failed to parse request body:", parseError);
      // Return an error immediately if parsing fails
      return new Response(
        JSON.stringify({ error: "Invalid request body format." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400, // Bad Request
        }
      );
    }

    let { orderId } = requestBody; // Destructure AFTER logging and successful parsing

    // Validate orderId: Allow number or string, but ensure it exists
    if (orderId === null || orderId === undefined || orderId === "") {
      console.error(
        `[Debug] orderId validation failed: Missing or empty. Value: ${orderId}`
      );
      throw new Error("Missing orderId provided.");
    }

    // Convert to string if it's a number, for consistency
    const orderIdString = String(orderId);
    console.log(
      `Validated orderId: ${orderIdString} (Original type: ${typeof orderId})`
    );

    console.log(`Fetching details for order ID: ${orderIdString}`);

    // --- Fetch Order Details ---
    const { data: orderData, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select(
        "id, first_name, last_name, email, services, total_amount, created_at"
      ) // Adjust columns as needed
      .eq("id", orderIdString) // Use the string version for the query
      .single();

    if (fetchError || !orderData) {
      console.error(`Error fetching order ${orderIdString}:`, fetchError);
      throw new Error(
        `Order not found or failed to fetch: ${
          fetchError?.message || "No data"
        }`
      );
    }

    console.log(`Order details fetched for ${orderData.email}`);

    // --- Construct Email Content (Basic Example) ---
    // You'll likely want to create a more detailed HTML template
    const customerName = `${orderData.first_name || ""} ${
      orderData.last_name || ""
    }`.trim();
    const subject = `Your CreditEval Order Receipt (#${orderData.id})`;
    const bodyText = `
      Hi ${customerName || "Customer"},

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
    console.log(
      `Sending receipt email to ${orderData.email} for order ${orderIdString}`
    ); // Log orderIdString
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: `CreditEval <${fromEmail}>`,
      to: [orderData.email], // Send to customer's email
      cc: ["support@crediteval.com", "guy@gcs.org"], // CC internal addresses
      subject: subject,
      text: bodyText, // Use text version
      // html: bodyHtml, // Optionally add HTML version
    });

    if (emailError) {
      console.error(
        `Resend error sending email for order ${orderIdString}:`,
        emailError
      ); // Log orderIdString
      // Log the error but maybe don't fail the whole function call?
      // Or return a specific error indicating email failure.
      // For now, we'll return success but log the error.
      // throw new Error(`Failed to send receipt email: ${emailError.message}`);
    } else {
      console.log(
        `Receipt email sent successfully for order ${orderIdString}. Email ID: ${emailData?.id}`
      ); // Log orderIdString
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
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error." }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: error.message.includes("Order not found")
          ? 404
          : error.message.includes("Invalid or missing")
          ? 400
          : 500,
      }
    );
  }
});

console.log("Send Order Receipt function handler registered.");
