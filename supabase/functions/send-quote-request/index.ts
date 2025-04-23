import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2"; // Import Supabase client
import { Resend } from "npm:resend";
import { getAllowedCorsHeaders } from "../_shared/cors.ts";

// --- Environment Variables ---
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const resendApiKey = Deno.env.get("RESEND_API_KEY");
const adminEmail = Deno.env.get("ADMIN_EMAIL_ADDRESS"); // Keep for potential future use
const fromEmail = Deno.env.get("FROM_EMAIL_ADDRESS");

// --- Initialize Clients ---
let supabaseAdmin: SupabaseClient | null = null;
if (supabaseUrl && supabaseServiceRoleKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
} else {
  console.error("Missing Supabase URL or Service Role Key environment variables.");
}

let resend: Resend | null = null;
if (resendApiKey) {
  resend = new Resend(resendApiKey);
} else {
   console.error("Missing RESEND_API_KEY environment variable.");
}

// Define the expected request body structure
interface QuoteRequestData {
  service: string | null;
  name: string;
  email: string;
  phone?: string;
  documentPaths?: string[];
  submittedAt: string;
  // Add optional language fields
  languageFrom?: string;
  languageTo?: string;
}

serve(async (req) => {
  const requestOrigin = req.headers.get("Origin");
  const corsHeaders = getAllowedCorsHeaders(requestOrigin); // Get headers using shared function

  // 1. Handle CORS preflight request
  if (req.method === "OPTIONS") {
    // Use the dynamically generated CORS headers
    return new Response("ok", { headers: corsHeaders });
  }

  // --- Check Initialization ---
   if (!supabaseAdmin || !resend || !fromEmail) {
    console.error("Missing environment variables (Supabase, Resend, or From Email). Function cannot proceed.");
    return new Response(JSON.stringify({ error: "Server configuration error." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }


  try {
    // 2. Parse request body
    const requestData = (await req.json()) as QuoteRequestData;

    // Validate required fields
    if (!requestData.email || !requestData.name || !requestData.service) {
      return new Response(JSON.stringify({ error: "Missing required fields (service, name, email)" }), {
        status: 400,
        // Include dynamic CORS headers in error response
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

     // 3. Insert data into the 'quotes' table
     console.log("Preparing to insert quote data:", {
        name: requestData.name,
        email: requestData.email,
        phone: requestData.phone,
        service: requestData.service,
        language_from: requestData.languageFrom,
        language_to: requestData.languageTo,
        document_paths: requestData.documentPaths,
     });
     const { data: insertData, error: insertError } = await supabaseAdmin
        .from('quotes')
        .insert([
          {
            name: requestData.name,
            email: requestData.email,
            phone: requestData.phone,
            service: requestData.service,
            language_from: requestData.languageFrom, // Use snake_case for DB
            language_to: requestData.languageTo,     // Use snake_case for DB
            document_paths: requestData.documentPaths,
            // status: 'new', // Default status is set in the table definition
            // created_at is set automatically
          },
        ])
        .select() // Optionally select the inserted data if needed
        .single(); // Assuming you insert one quote at a time

      if (insertError) {
        console.error("!!! Database Insert Error:", insertError); // Make error more prominent
        // Log the data that failed to insert
        console.error("!!! Failed to insert data:", {
            name: requestData.name, email: requestData.email, phone: requestData.phone, service: requestData.service,
            language_from: requestData.languageFrom, language_to: requestData.languageTo, document_paths: requestData.documentPaths
        });
        throw new Error(`Database insert error: ${insertError.message}`);
      }

      console.log("+++ Quote data inserted successfully. Inserted row:", insertData); // Log success and inserted data


    // 4. Construct Email Content
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
        ${requestData.languageFrom ? `<li>Language From: ${requestData.languageFrom}</li>` : ""}
        ${requestData.languageTo ? `<li>Language To: ${requestData.languageTo}</li>` : ""}
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

    // 5. Send Emails using Resend
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


    // 6. Return success response
    return new Response(JSON.stringify({ message: "Quote request submitted, saved, and emails sent." }), {
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
