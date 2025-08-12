import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2"; // Import Supabase client
import { Resend } from "npm:resend";
import { corsHeaders } from "../_shared/cors.ts"; // Import the corsHeaders object directly

// --- Environment Variables ---
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const resendApiKey = Deno.env.get("RESEND_API_KEY");
const adminEmail = Deno.env.get("ADMIN_EMAIL_ADDRESS"); // Keep for potential future use
const fromEmail = "noreply@crediteval.com"; //Deno.env.get("FROM_EMAIL_ADDRESS");
const klaviyoApiKey = Deno.env.get("KLAVIYO_PRIVATE_API_KEY"); // Added Klaviyo API Key

// --- Initialize Clients ---
let supabaseAdmin: SupabaseClient | null = null;
if (supabaseUrl && supabaseServiceRoleKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
} else {
  console.error(
    "Missing Supabase URL or Service Role Key environment variables."
  );
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
  languageFrom?: string;
  languageTo?: string;
  delivery?: string; // New field
  urgency?: string; // New field
  totalPage?: string; // New field
}

serve(async (req) => {
  // No need to get requestOrigin if using wildcard CORS headers from the shared file
  // const requestOrigin = req.headers.get("Origin");
  // Use the imported corsHeaders directly
  // const corsHeaders = getAllowedCorsHeaders(requestOrigin); // Removed incorrect function call

  // 1. Handle CORS preflight request
  if (req.method === "OPTIONS") {
    // Use the dynamically generated CORS headers
    return new Response("ok", { headers: corsHeaders });
  }

  // --- Check Initialization ---
  if (!supabaseAdmin || !resend || !fromEmail) {
    console.error(
      "Missing environment variables (Supabase, Resend, or From Email). Function cannot proceed."
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
    // 2. Parse request body
    const requestData = (await req.json()) as QuoteRequestData;

    // Validate required fields
    if (!requestData.email || !requestData.name || !requestData.service) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields (service, name, email)",
        }),
        {
          status: 400,
          // Include dynamic CORS headers in error response
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 3. Insert data into the 'quotes' table
    // Construct the services JSON object
    const servicesJson = {
      service_type: requestData.service,
      delivery: requestData.delivery,
      urgency: requestData.urgency,
      ...(requestData.languageFrom && {
        language_from: requestData.languageFrom,
      }),
      ...(requestData.languageTo && { language_to: requestData.languageTo }),
      ...(requestData.totalPage && { total_page: requestData.totalPage }), // Include total_page
    };

    console.log("Preparing to insert quote data:", {
      name: requestData.name,
      email: requestData.email,
      phone: requestData.phone,
      service_type: requestData.service,
      services: servicesJson, // New services JSON column
      document_paths: requestData.documentPaths,
    });

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from("quotes")
      .insert([
        {
          name: requestData.name,
          email: requestData.email,
          phone: requestData.phone,
          service_type: requestData.service,
          services: servicesJson, // Insert the JSON object
          document_paths: requestData.documentPaths,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("!!! Database Insert Error:", insertError); // Make error more prominent
      // Log the data that failed to insert
      console.error("!!! Failed to insert data:", {
        name: requestData.name,
        email: requestData.email,
        /* phone: requestData.phone, */ service_type: requestData.service, // Corrected column name and removed phone
        // language_from: requestData.languageFrom, // Removed - Column does not exist
        // language_to: requestData.languageTo,     // Removed - Column does not exist
        document_paths: requestData.documentPaths,
      });
      throw new Error(`Database insert error: ${insertError.message}`);
    }

    console.log(
      "+++ Quote data inserted successfully. Inserted row:",
      insertData
    ); // Log success and inserted data

    // --- Send Klaviyo Event ---
    if (klaviyoApiKey && klaviyoApiKey !== "YOUR_KLAVIYO_PRIVATE_API_KEY") {
      const klaviyoPayload = {
        data: {
          type: "event",
          attributes: {
            profile: {
              email: requestData.email,
            },
            metric: {
              name: "quote_requested",
            },
            properties: {
              quote_id: insertData.id,
              service_type: requestData.service,
              name: requestData.name,
              phone: requestData.phone,
              language_from: requestData.languageFrom,
              language_to: requestData.languageTo,
              total_page: requestData.totalPage, // Include total_page
              delivery: requestData.delivery, // Include delivery
              urgency: requestData.urgency, // Include urgency
              document_count: requestData.documentPaths?.length || 0,
              submitted_at: requestData.submittedAt,
            },
          },
        },
      };

      console.log(
        "Constructed Klaviyo Payload:",
        JSON.stringify(klaviyoPayload, null, 2)
      );

      try {
        const klaviyoApiUrl = "https://a.klaviyo.com/api/events/";
        const klaviyoResponse = await fetch(klaviyoApiUrl, {
          method: "POST",
          headers: {
            Authorization: `Klaviyo-API-Key ${klaviyoApiKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            revision: "2023-02-22", // Recommended revision
          },
          body: JSON.stringify(klaviyoPayload),
        });

        console.log(`Klaviyo API Response Status: ${klaviyoResponse.status}`);
        if (!klaviyoResponse.ok || klaviyoResponse.status !== 202) {
          // 202 Accepted is success for events
          const errorText = await klaviyoResponse.text();
          console.error(
            `Klaviyo API request failed or returned unexpected status ${klaviyoResponse.status}:`,
            errorText
          );
          // Decide if this should be a critical failure or just logged
        } else {
          console.log("Klaviyo event 'quote_requested' sent successfully.");
        }
      } catch (klaviyoError) {
        console.error("Error sending event to Klaviyo:", klaviyoError);
        // Log error but continue with email sending
      }
    } else {
      console.warn(
        "Klaviyo API Key missing or placeholder. Skipping Klaviyo event."
      );
    }
    // --- End Klaviyo Event ---

    // 4. Construct Email Content
    const userSubject = "Quote Request Confirmation - CreditEval";
    const userHtmlBody = `
      <h1>Thank you for your quote request, ${requestData.name}!</h1>
      <p>We have received your request for a quote regarding: <strong>${
        requestData.service
      }</strong>.</p>
      <p>Details received:</p>
      <ul>
        <li>Name: ${requestData.name}</li>
        <li>Email: ${requestData.email}</li>
        ${requestData.phone ? `<li>Phone: ${requestData.phone}</li>` : ""}
        ${
          requestData.delivery
            ? `<li>Delivery: ${requestData.delivery}</li>`
            : ""
        }
        ${requestData.urgency ? `<li>Urgency: ${requestData.urgency}</li>` : ""}
        ${
          requestData.documentPaths && requestData.documentPaths.length > 0
            ? `<li>Documents: ${requestData.documentPaths.length} file(s) received</li>`
            : ""
        }
      </ul>
      <p>We will review your request and get back to you shortly.</p>
      <p>Best regards,<br>The CreditEval Team</p>
    `;

    const adminSubject = `New Quote Request Received: ${requestData.service}`;
    const adminHtmlBody = `
      <h1>New Quote Request</h1>
      <p>A new quote request has been submitted:</p>
      <ul>
        <li>Service Type: <strong>${requestData.service}</strong></li>
        <li>Name: ${requestData.name}</li>
        <li>Email: ${requestData.email}</li>
        ${requestData.phone ? `<li>Phone: ${requestData.phone}</li>` : ""}
        ${
          requestData.languageFrom
            ? `<li>Language From: ${requestData.languageFrom}</li>`
            : ""
        }
        ${
          requestData.languageTo
            ? `<li>Language To: ${requestData.languageTo}</li>`
            : ""
        }
        ${
          requestData.totalPage
            ? `<li>Total Page: ${requestData.totalPage}</li>`
            : ""
        }
        ${
          requestData.delivery
            ? `<li>Delivery: ${requestData.delivery}</li>`
            : ""
        }
        ${requestData.urgency ? `<li>Urgency: ${requestData.urgency}</li>` : ""}
        <li>Submitted At: ${new Date(
          requestData.submittedAt
        ).toLocaleString()}</li>
      </ul>
      ${
        requestData.documentPaths && requestData.documentPaths.length > 0
          ? `<p><strong>Documents (${
              requestData.documentPaths.length
            }):</strong></p>
           <ul>${requestData.documentPaths
             .map(
               (path) =>
                 `<li><a href="https://lholxkbtosixszauuzmb.supabase.co/storage/v1/object/public/documents/${path}">${path}</a></li>`
             )
             .join("")}</ul>
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
      to: "support@crediteval.com", // Send to support email
      cc: ["staffan@gcs.org", "guy@gcs.org", "melgcsvalencia@gmail.com"], // CC additional staff
      subject: adminSubject,
      html: adminHtmlBody,
    });

    // Wait for both emails to be sent
    const [userEmailResult, adminEmailResult] = await Promise.allSettled([
      sendUserEmail,
      sendAdminEmail,
    ]);

    // Check results
    if (userEmailResult.status === "rejected") {
      console.error("Failed to send user email:", userEmailResult.reason);
      // Decide if this is a critical failure
    }
    if (adminEmailResult.status === "rejected") {
      console.error("Failed to send admin email:", adminEmailResult.reason);
      // Decide if this is a critical failure. Maybe return error if admin email fails?
      return new Response(
        JSON.stringify({ error: "Failed to send admin notification email." }),
        {
          status: 500,
          // Include dynamic CORS headers in error response
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (
      userEmailResult.status === "rejected" &&
      adminEmailResult.status === "rejected"
    ) {
      return new Response(
        JSON.stringify({ error: "Failed to send both user and admin emails." }),
        {
          status: 500,
          // Include dynamic CORS headers in error response
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 6. Return success response
    return new Response(
      JSON.stringify({
        message: "Quote request submitted, saved, and emails sent.",
      }),
      {
        // Include dynamic CORS headers in success response
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing quote request:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      {
        status: 500,
        // Include dynamic CORS headers in catch block error response
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
