import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend"; // Using Resend npm package
import { getAllowedCorsHeaders } from "../_shared/cors.ts"; // Import shared CORS handler

// Initialize Resend with API key from environment variables (Supabase secrets)
const resend = new Resend(Deno.env.get("RESEND_API_KEY")!);
const adminEmail = Deno.env.get("ADMIN_EMAIL_ADDRESS")!;
const fromEmail = Deno.env.get("FROM_EMAIL_ADDRESS")!; // Email address verified with Resend

// Define the expected request body structure
interface QuoteRequestData {
  service: string | null;
  name: string;
  email: string;
  phone?: string;
  documentPaths?: string[];
  submittedAt: string;
}

serve(async (req) => {
  const requestOrigin = req.headers.get("Origin");
  const corsHeaders = getAllowedCorsHeaders(requestOrigin); // Get headers using shared function

  // 1. Handle CORS preflight request
  if (req.method === "OPTIONS") {
    // Use the dynamically generated CORS headers
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 2. Parse request body
    const requestData = (await req.json()) as QuoteRequestData;

    if (!requestData.email || !requestData.name || !requestData.service) {
      return new Response(JSON.stringify({ error: "Missing required fields (service, name, email)" }), {
        status: 400,
        // Include dynamic CORS headers in error response
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Construct Email Content
    const userSubject = "Quote Request Confirmation - CreditEval";
    const userHtmlBody = `
      <h1>Thank you for your quote request, ${requestData.name}!</h1>
      <p>We have received your request for a quote regarding: <strong>${requestData.service}</strong>.</p>
      <p>Details received:</p>
      <ul>
        <li>Name: ${requestData.name}</li>
        <li>Email: ${requestData.email}</li>
        ${requestData.phone ? `<li>Phone: ${requestData.phone}</li>` : ""}
        ${requestData.documentPaths && requestData.documentPaths.length > 0
        ? `<li>Documents: ${requestData.documentPaths.length} file(s) received</li>`
        : ""}
      </ul>
      <p>We will review your request and get back to you shortly.</p>
      <p>Best regards,<br>The CreditEval Team</p>
    `;

    const adminSubject = `New Quote Request Received: ${requestData.service}`;
    const adminHtmlBody = `
      <h1>New Quote Request</h1>
      <p>A new quote request has been submitted:</p>
      <ul>
        <li>Service: <strong>${requestData.service}</strong></li>
        <li>Name: ${requestData.name}</li>
        <li>Email: ${requestData.email}</li>
        ${requestData.phone ? `<li>Phone: ${requestData.phone}</li>` : ""}
        <li>Submitted At: ${new Date(requestData.submittedAt).toLocaleString()}</li>
      </ul>
      ${requestData.documentPaths && requestData.documentPaths.length > 0
        ? `<p><strong>Documents (${requestData.documentPaths.length}):</strong></p>
           <ul>${requestData.documentPaths.map(path => `<li>${path}</li>`).join('')}</ul>
           <p><em>Note: Document paths refer to storage locations. Access them via your Supabase dashboard or appropriate tools.</em></p>`
        : "<p>No documents were uploaded with this request.</p>"
      }
      <p>Please follow up with the client.</p>
    `;

    // 4. Send Emails using Resend
    const sendUserEmail = resend.emails.send({
      from: fromEmail,
      to: requestData.email,
      subject: userSubject,
      html: userHtmlBody,
    });

    const sendAdminEmail = resend.emails.send({
      from: fromEmail,
      to: "support@gcs.org", // Send to support email
      cc: ["staffan@gcs.org", "guy@gcs.org"], // CC additional staff
      subject: adminSubject,
      html: adminHtmlBody,
    });

    // Wait for both emails to be sent
    const [userEmailResult, adminEmailResult] = await Promise.allSettled([sendUserEmail, sendAdminEmail]);

    // Check results
    if (userEmailResult.status === 'rejected') {
        console.error("Failed to send user email:", userEmailResult.reason);
        // Decide if this is a critical failure
    }
     if (adminEmailResult.status === 'rejected') {
        console.error("Failed to send admin email:", adminEmailResult.reason);
        // Decide if this is a critical failure. Maybe return error if admin email fails?
         return new Response(JSON.stringify({ error: "Failed to send admin notification email." }), {
            status: 500,
            // Include dynamic CORS headers in error response
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

     if (userEmailResult.status === 'rejected' && adminEmailResult.status === 'rejected') {
         return new Response(JSON.stringify({ error: "Failed to send both user and admin emails." }), {
            status: 500,
            // Include dynamic CORS headers in error response
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
     }


    // 5. Return success response
    return new Response(JSON.stringify({ message: "Quote request processed and emails sent." }), {
      // Include dynamic CORS headers in success response
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error processing quote request:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
      status: 500,
      // Include dynamic CORS headers in catch block error response
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
