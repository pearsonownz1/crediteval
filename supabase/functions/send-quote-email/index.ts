import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getAllowedCorsHeaders } from '../_shared/cors.ts'; // Import the function

// TODO: Replace with your actual Resend API key (use environment variables!)
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const RESEND_API_URL = 'https://api.resend.com/emails';

// Use the verified email address provided by the user
const FROM_EMAIL = 'noreply@mail.crediteval.com';

console.log('send-quote-email function initialized');

serve(async (req) => {
  const requestOrigin = req.headers.get("Origin");
  const corsHeaders = getAllowedCorsHeaders(requestOrigin); // Get headers dynamically

  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders }); // Use dynamic headers
  }

  try {
    // 1. Parse the request body to get quote details
    // 1. Parse the request body to get quote details
    const quote = await req.json();
    console.log('Received quote data:', quote);

    // Use correct field names 'name' and 'email' for validation
    if (!quote || !quote.id || !quote.email || !quote.name || !quote.service_type || !quote.price) {
      throw new Error('Missing required quote details in request body.');
    }
    // Ensure price is a number for formatting
    const priceNumber = Number(quote.price);
    if (isNaN(priceNumber)) {
        throw new Error('Invalid price format received.');
    }

    // 2. Construct the email content
    console.log("Constructing email content...");
    const appBaseUrl = 'https://www.crediteval.com'; // Use the correct frontend domain
    const quoteLink = `${appBaseUrl}/quote/${quote.id}`; // Construct the public quote link
    const subject = `Your Quote from CreditEval.com (#${quote.id.substring(0, 8)})`;
    let expiresOnHtml = '';
    try {
        // Safely handle expires_at date formatting
        if (quote.expires_at) {
            expiresOnHtml = `<li><strong>Expires On:</strong> ${new Date(quote.expires_at).toLocaleDateString()}</li>`;
        }
    } catch (dateError) {
        console.error("Error formatting expires_at date:", quote.expires_at, dateError);
        // Optionally add a note about the expiration date format error
    }

    const emailBodyHtml = `
      <h1>Your Quote from CreditEval</h1>
      <p>Hello ${quote.name},</p>
      <p>Thank you for your interest! Here are the details of your quote:</p>
      <ul>
        <li><strong>Service:</strong> ${quote.service_type}</li>
        <li><strong>Price:</strong> $${priceNumber.toFixed(2)}</li>
        ${expiresOnHtml}
      </ul>
      <p>To proceed with payment and start your service, please click the link below:</p>
      <p><a href="${quoteLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Pay Now</a></p>
      <p>Or copy and paste this link into your browser: ${quoteLink}</p>
      <p>If you have any questions, please contact us.</p>
      <p>Thank you,<br>The CreditEval Team</p>
    `;

    // 3. Send the email using Resend
    console.log("Checking RESEND_API_KEY...");
    if (!RESEND_API_KEY) {
        console.error('RESEND_API_KEY is not set in environment variables.');
        // Return 500 for server config error
        return new Response(JSON.stringify({ error: 'Email sending configuration error on server.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }

    const emailPayload = {
        from: FROM_EMAIL,
        to: [quote.email], // Use quote.email
        subject: subject,
        html: emailBodyHtml,
    };

    console.log(`Attempting to send email via Resend to ${quote.email} with payload:`, JSON.stringify(emailPayload, null, 2));
    const resendResponse = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [quote.email], // Use quote.email
        subject: subject,
        html: emailBodyHtml,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Resend API Error:', resendData);
      throw new Error(`Failed to send email: ${resendData.message || resendResponse.statusText}`);
    }

    console.log('Email sent successfully via Resend:', resendData.id);

    // 4. Return success response
    return new Response(JSON.stringify({ message: 'Quote email sent successfully!', emailId: resendData.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, // Use dynamic headers
      status: 200,
    });

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      // Return 500 for internal errors (like Resend failure), 400 was for initial validation
      status: 500,
    });
  }
});
