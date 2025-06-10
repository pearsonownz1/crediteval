import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@3.2.0";
import { getAllowedCorsHeaders } from "../_shared/cors.ts";

console.log("Send Abandoned Cart Email function starting...");

// --- Environment Variables ---
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const resendApiKey = Deno.env.get("RESEND_API_KEY");
const fromEmail = "noreply@mail.crediteval.com";
const baseUrl = Deno.env.get("SITE_URL") || "https://crediteval.com"; // Your site URL

// --- Initialize Clients ---
let supabaseAdmin: SupabaseClient | null = null;
if (supabaseUrl && supabaseServiceRoleKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
}

let resend: Resend | null = null;
if (resendApiKey) {
  resend = new Resend(resendApiKey);
}

// --- Helper function to create resume URL ---
function createResumeUrl(orderData: any): string {
  const params = new URLSearchParams();

  // Add customer info
  if (orderData.customerInfo) {
    if (orderData.customerInfo.firstName)
      params.append("firstName", orderData.customerInfo.firstName);
    if (orderData.customerInfo.lastName)
      params.append("lastName", orderData.customerInfo.lastName);
    if (orderData.customerInfo.email)
      params.append("email", orderData.customerInfo.email);
    if (orderData.customerInfo.phone)
      params.append("phone", orderData.customerInfo.phone);
    if (orderData.customerInfo.company)
      params.append("company", orderData.customerInfo.company);
  }

  // Add order ID
  if (orderData.orderId) {
    params.append("orderId", orderData.orderId);
  }

  // Add service selection
  if (orderData.services) {
    if (orderData.services.type)
      // Use 'type' instead of 'selectedService'
      params.append("type", orderData.services.type);
    if (orderData.services.urgency)
      params.append("urgency", orderData.services.urgency);
    if (orderData.services.deliveryType)
      // Use 'deliveryType'
      params.append("deliveryType", orderData.services.deliveryType);
    if (orderData.services.pageCount)
      params.append("pageCount", orderData.services.pageCount.toString());
    if (orderData.services.evaluationType)
      params.append("evaluationType", orderData.services.evaluationType);
    if (orderData.services.languageFrom)
      params.append("languageFrom", orderData.services.languageFrom);
    if (orderData.services.languageTo)
      params.append("languageTo", orderData.services.languageTo);
    // Add visaType if service type is expert
    if (orderData.services.type === "expert" && orderData.services.visaType)
      params.append("visaType", orderData.services.visaType);

    // Add shipping info
    if (orderData.services.shippingInfo) {
      if (orderData.services.shippingInfo.country)
        params.append("country", orderData.services.shippingInfo.country);
      if (orderData.services.shippingInfo.address)
        params.append("address", orderData.services.shippingInfo.address);
      if (orderData.services.shippingInfo.apartment)
        params.append("apartment", orderData.services.shippingInfo.apartment);
      if (orderData.services.shippingInfo.city)
        params.append("city", orderData.services.shippingInfo.city);
      if (orderData.services.shippingInfo.state)
        params.append("state", orderData.services.shippingInfo.state);
      if (orderData.services.shippingInfo.zip)
        params.append("zip", orderData.services.shippingInfo.zip);
    }
  }

  // Add current step
  if (orderData.currentStep !== undefined)
    params.append("step", orderData.currentStep.toString());

  return `${baseUrl}/order-wizard?${params.toString()}`;
}

// --- Helper function to generate email content ---
function generateEmailContent(orderData: any, resumeUrl: string) {
  const customerName = orderData.customerInfo
    ? `${orderData.customerInfo.firstName || ""} ${
        orderData.customerInfo.lastName || ""
      }`.trim()
    : "Customer";

  const subject = "Complete Your CreditEval Order - We Saved Your Progress!";

  // Create summary of filled fields
  let progressSummary = "Here's what you've already filled out:\n\n";

  if (orderData.customerInfo) {
    progressSummary += "📋 Contact Information:\n";
    if (orderData.customerInfo.firstName)
      progressSummary += `• Name: ${orderData.customerInfo.firstName} ${
        orderData.customerInfo.lastName || ""
      }\n`;
    if (orderData.customerInfo.email)
      progressSummary += `• Email: ${orderData.customerInfo.email}\n`;
    if (orderData.customerInfo.phone)
      progressSummary += `• Phone: ${orderData.customerInfo.phone}\n`;
    if (orderData.customerInfo.company)
      progressSummary += `• Company: ${orderData.customerInfo.company}\n`;
    progressSummary += "\n";
  }

  if (orderData.services) {
    progressSummary += "🔧 Service Details:\n";
    if (orderData.services.type)
      progressSummary += `• Service Type: ${orderData.services.type}\n`;
    if (orderData.services.pageCount)
      progressSummary += `• Page Count: ${orderData.services.pageCount}\n`;
    if (orderData.services.evaluationType)
      progressSummary += `• Evaluation Type: ${orderData.services.evaluationType}\n`;
    if (orderData.services.languageFrom && orderData.services.languageTo)
      progressSummary += `• Languages: ${orderData.services.languageFrom} to ${orderData.services.languageTo}\n`;
    if (orderData.services.urgency)
      progressSummary += `• Urgency: ${orderData.services.urgency}\n`;
    if (orderData.services.deliveryType)
      progressSummary += `• Delivery: ${orderData.services.deliveryType}\n`;
    if (orderData.services.shippingInfo) {
      if (orderData.services.shippingInfo.address)
        progressSummary += `• Shipping Address: ${orderData.services.shippingInfo.address}\n`;
      if (orderData.services.shippingInfo.apartment)
        progressSummary += `• Apartment/Suite: ${orderData.services.shippingInfo.apartment}\n`;
      if (orderData.services.shippingInfo.city)
        progressSummary += `• City: ${orderData.services.shippingInfo.city}\n`;
      if (orderData.services.shippingInfo.state)
        progressSummary += `• State/Province: ${orderData.services.shippingInfo.state}\n`;
      if (orderData.services.shippingInfo.zip)
        progressSummary += `• Zip/Postal Code: ${orderData.services.shippingInfo.zip}\n`;
      if (orderData.services.shippingInfo.country)
        progressSummary += `• Country: ${orderData.services.shippingInfo.country}\n`;
    }
    if (orderData.services.specialInstructions)
      progressSummary += `• Special Instructions: ${orderData.services.specialInstructions}\n`;
    progressSummary += "\n";
  }

  if (orderData.documents && orderData.documents.length > 0) {
    progressSummary += "📄 Uploaded Documents:\n";
    orderData.documents.forEach((doc: any) => {
      if (doc.name) progressSummary += `• ${doc.name}\n`;
    });
    progressSummary += "\n";
  }

  const bodyText = `
Hi ${customerName || "there"},

We noticed you started placing an order with CreditEval but didn't finish. Don't worry - we've saved your progress!

${progressSummary}

Complete your order now and get the credit repair service you need:
${resumeUrl}

Your information is safely stored and ready to continue where you left off.

If you have any questions or need assistance, feel free to reach out to our support team at support@crediteval.com.

Best regards,
The CreditEval Team

---
This is an automated message. If you completed your order or no longer wish to receive these emails, please ignore this message.
  `;

  const bodyHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete Your CreditEval Order</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0066cc; color: white; padding: 20px; text-align: center; margin-bottom: 20px; }
    .content { padding: 20px; }
    .progress-box { background: #f8f9fa; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0; }
    .cta-button { display: inline-block; background: #004080; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; } /* Changed to a darker blue for better contrast */
    .footer { font-size: 12px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Complete Your CreditEval Order</h1>
  </div>
  
  <div class="content">
    <p>Hi ${customerName || "there"},</p>
    
    <p>We noticed you started placing an order with CreditEval but didn't finish. Don't worry - we've saved your progress!</p>
    
    <div class="progress-box">
      <h3>📋 Your Progress So Far:</h3>
      ${
        orderData.customerInfo
          ? `
        <p><strong>Contact Information:</strong></p>
        <ul>
          ${
            orderData.customerInfo.firstName
              ? `<li>Name: ${orderData.customerInfo.firstName} ${
                  orderData.customerInfo.lastName || ""
                }</li>`
              : ""
          }
          ${
            orderData.customerInfo.email
              ? `<li>Email: ${orderData.customerInfo.email}</li>`
              : ""
          }
          ${
            orderData.customerInfo.phone
              ? `<li>Phone: ${orderData.customerInfo.phone}</li>`
              : ""
          }
          ${
            orderData.customerInfo.company
              ? `<li>Company: ${orderData.customerInfo.company}</li>`
              : ""
          }
        </ul>
      `
          : ""
      }
      
      ${
        orderData.services
          ? `
        <p><strong>Service Details:</strong></p>
        <ul>
          ${
            orderData.services.type
              ? `<li>Service Type: ${orderData.services.type}</li>`
              : ""
          }
          ${
            orderData.services.pageCount
              ? `<li>Page Count: ${orderData.services.pageCount}</li>`
              : ""
          }
          ${
            orderData.services.evaluationType
              ? `<li>Evaluation Type: ${orderData.services.evaluationType}</li>`
              : ""
          }
          ${
            orderData.services.languageFrom && orderData.services.languageTo
              ? `<li>Languages: ${orderData.services.languageFrom} to ${orderData.services.languageTo}</li>`
              : ""
          }
          ${
            orderData.services.urgency
              ? `<li>Urgency: ${orderData.services.urgency}</li>`
              : ""
          }
          ${
            orderData.services.deliveryType
              ? `<li>Delivery: ${orderData.services.deliveryType}</li>`
              : ""
          }
          ${
            orderData.services.shippingInfo?.address
              ? `<li>Shipping Address: ${orderData.services.shippingInfo.address}</li>`
              : ""
          }
          ${
            orderData.services.shippingInfo?.apartment
              ? `<li>Apartment/Suite: ${orderData.services.shippingInfo.apartment}</li>`
              : ""
          }
          ${
            orderData.services.shippingInfo?.city
              ? `<li>City: ${orderData.services.shippingInfo.city}</li>`
              : ""
          }
          ${
            orderData.services.shippingInfo?.state
              ? `<li>State/Province: ${orderData.services.shippingInfo.state}</li>`
              : ""
          }
          ${
            orderData.services.shippingInfo?.zip
              ? `<li>Zip/Postal Code: ${orderData.services.shippingInfo.zip}</li>`
              : ""
          }
          ${
            orderData.services.shippingInfo?.country
              ? `<li>Country: ${orderData.services.shippingInfo.country}</li>`
              : ""
          }
          ${
            orderData.services.specialInstructions
              ? `<li>Special Instructions: ${orderData.services.specialInstructions}</li>`
              : ""
          }
        </ul>
      `
          : ""
      }

      ${
        orderData.documents && orderData.documents.length > 0
          ? `
        <p><strong>Uploaded Documents:</strong></p>
        <ul>
          ${orderData.documents
            .map((doc: any) => (doc.name ? `<li>${doc.name}</li>` : ""))
            .join("")}
        </ul>
      `
          : ""
      }
    </div>
    
    <p>Complete your order now and get the credit repair service you need:</p>
    
    <a href="${resumeUrl}" class="cta-button">Continue Your Order</a>
    
    <p>Your information is safely stored and ready to continue where you left off.</p>
    
    <p>If you have any questions or need assistance, feel free to reach out to our support team at <a href="mailto:support@crediteval.com">support@crediteval.com</a>.</p>
    
    <p>Best regards,<br>The CreditEval Team</p>
  </div>
  
  <div class="footer">
    <p>This is an automated message. If you completed your order or no longer wish to receive these emails, please ignore this message.</p>
  </div>
</body>
</html>
  `;

  return { subject, bodyText, bodyHtml };
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
    console.log("[Debug] Attempting to parse request body...");
    let requestBody;
    try {
      requestBody = await req.json();
      console.log(
        "[Debug] Successfully parsed request body:",
        JSON.stringify(requestBody, null, 2)
      );
    } catch (parseError) {
      console.error("[Critical] Failed to parse request body:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid request body format." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const { orderData, sessionId } = requestBody;

    // Validate required fields
    if (
      !orderData ||
      !orderData.customerInfo ||
      !orderData.customerInfo.email
    ) {
      console.error("[Debug] Missing required fields: orderData or email");
      return new Response(
        JSON.stringify({ error: "Missing required order data or email." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const customerEmail = orderData.customerInfo.email;
    console.log(`Processing abandoned cart email for: ${customerEmail}`);

    // Check if we've already sent an abandoned cart email for this session recently
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: recentEmails, error: checkError } = await supabaseAdmin
      .from("abandoned_cart_emails") // You'll need to create this table
      .select("id")
      .eq("email", customerEmail)
      .eq("session_id", sessionId || "unknown")
      .gte("created_at", oneHourAgo)
      .limit(1);

    if (checkError) {
      console.error("Error checking recent emails:", checkError);
      // Continue anyway - don't block the email
    } else if (recentEmails && recentEmails.length > 0) {
      console.log(
        `Abandoned cart email already sent recently for ${customerEmail}`
      );
      return new Response(
        JSON.stringify({
          success: true,
          message: "Email already sent recently.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Generate resume URL and email content
    const resumeUrl = createResumeUrl(orderData);
    const { subject, bodyText, bodyHtml } = generateEmailContent(
      orderData,
      resumeUrl
    );

    // --- Send Email via Resend ---
    console.log(`Sending abandoned cart email to ${customerEmail}`);
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: `CreditEval <${fromEmail}>`,
      to: [customerEmail],
      subject: subject,
      text: bodyText,
      html: bodyHtml,
    });

    if (emailError) {
      console.error(`Resend error sending abandoned cart email:`, emailError);
      throw new Error(
        `Failed to send abandoned cart email: ${emailError.message}`
      );
    } else {
      console.log(
        `Abandoned cart email sent successfully. Email ID: ${emailData?.id}`
      );
    }

    // Log the sent email to prevent duplicates
    try {
      await supabaseAdmin.from("abandoned_cart_emails").insert({
        email: customerEmail,
        session_id: sessionId || "unknown",
        order_data: orderData,
        resume_url: resumeUrl,
        email_id: emailData?.id,
        created_at: new Date().toISOString(),
      });
    } catch (logError) {
      console.error("Error logging abandoned cart email:", logError);
      // Don't fail the function if logging fails
    }

    // --- Respond Success ---
    return new Response(
      JSON.stringify({
        success: true,
        message: "Abandoned cart email sent successfully.",
        resumeUrl: resumeUrl,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing abandoned cart email request:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error." }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

console.log("Send Abandoned Cart Email function handler registered.");
