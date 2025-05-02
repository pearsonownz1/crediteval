import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts'; // Assuming cors.ts is still needed

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Received raw body from frontend:", JSON.stringify(body, null, 2)); // Log received body

    // Validate required fields from frontend payload
    if (!body.email) {
      console.error("Validation Error: Missing email in request body");
      return new Response(
        JSON.stringify({ error: 'Missing email in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!body.metric) {
       console.warn("Warning: Missing metric in request body, defaulting to 'checkout_started'");
       // Allow default, but log it
    }

    // Construct the correct Klaviyo payload structure
    const klaviyoPayload = {
      data: {
        type: 'event',
        attributes: {
          profile: {
            // Use the email from the incoming request body
            email: body.email
            // Add other profile identifiers like phone_number if available and needed
            // phone_number: body.phone_number // Example if phone was passed
          },
          metric: {
            // Use metric from body or default
            name: body.metric || 'checkout_started'
          },
          properties: {
            // Map properties from the flat incoming body
            quote_id: body.quote_id,
            value: body.value,
            resume_link: body.resume_link,
            // Only include essential properties as per the checklist example
            // service_type: body.service_type, // Temporarily removed
            // evaluation_type: body.evaluation_type, // Temporarily removed
            // urgency: body.urgency // Temporarily removed
          }
        }
      }
    };

    console.log("Constructed Klaviyo Payload:", JSON.stringify(klaviyoPayload, null, 2)); // Log the payload being sent

    const klaviyoApiKey = Deno.env.get("KLAVIYO_PRIVATE_API_KEY") || "pk_1e92b4896bab92fc685c577f6fe6ebdb5c"; // Use Env Var or fallback to provided key

    if (!klaviyoApiKey || klaviyoApiKey === "YOUR_KLAVIYO_PRIVATE_API_KEY") {
        console.error("Security Error: Klaviyo API Key is missing or still set to placeholder.");
        // Return a generic error to the client, but log the specific issue server-side.
        return new Response(
            JSON.stringify({ error: 'Internal server configuration error.' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }


    const klaviyoApiUrl = 'https://a.klaviyo.com/api/events/';
    console.log(`Sending event to Klaviyo API: ${klaviyoApiUrl}`);

    const res = await fetch(klaviyoApiUrl, {
      method: 'POST',
      headers: {
        // Use the correct Authorization header format
        'Authorization': `Klaviyo-API-Key ${klaviyoApiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'revision': '2023-02-22' // Recommended revision header
      },
      body: JSON.stringify(klaviyoPayload) // Send the correctly structured payload
    });

    console.log(`Klaviyo API Response Status: ${res.status}`);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Klaviyo API request failed with status ${res.status}:`, errorText); // Log detailed error
      // Return a more informative error structure if possible
      let errorDetails = errorText;
      try {
          errorDetails = JSON.parse(errorText); // Try parsing Klaviyo's JSON error
      } catch (_) {
          // Keep as text if not JSON
      }
      return new Response(
        JSON.stringify({
          error: `Klaviyo API request failed with status ${res.status}`,
          details: errorDetails
        }),
        { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } } // Return Klaviyo's status
      );
    }

    // Handle potential success responses (202 Accepted is common for events)
    if (res.status === 202) {
        console.log("Klaviyo event accepted successfully (Status 202).");
        return new Response(null, { status: 204, headers: corsHeaders }); // Return 204 No Content to frontend on success
    } else {
        // Handle other potential success codes if necessary
        const responseBody = await res.text(); // Read body for unexpected success codes
        console.log(`Klaviyo API returned unexpected success status ${res.status}:`, responseBody);
        return new Response(responseBody, { status: res.status, headers: { ...corsHeaders, 'Content-Type': res.headers.get('Content-Type') || 'application/json' } });
    }

  } catch (err) {
    console.error("Unexpected error processing request:", err); // Log the full error
    return new Response(
      JSON.stringify({ error: 'Unexpected server error', details: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
