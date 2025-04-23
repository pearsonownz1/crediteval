import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { getAllowedCorsHeaders } from '../_shared/cors.ts'; // Import the function
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Environment variables should be set in your Supabase project settings
const TO_EMAIL = Deno.env.get('CONTACT_FORM_TO_EMAIL') || 'support@gcs.org';
const CC_EMAIL = Deno.env.get('CONTACT_FORM_CC_EMAIL') || 'guy@gcs.org';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase URL or Service Role Key environment variables.');
  // In a real scenario, you might want to handle this more gracefully
  // or ensure these are always set during deployment.
}

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  inquiryType: string;
  message: string;
}

serve(async (req: Request) => {
  // Get origin header
  const origin = req.headers.get('origin');
  // Get dynamic CORS headers based on origin
  const dynamicCorsHeaders = getAllowedCorsHeaders(origin);

  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    // Return dynamic headers for OPTIONS request
    return new Response('ok', { headers: dynamicCorsHeaders });
  }

  try {
    // Ensure Supabase client is initialized only if variables are present
    let supabaseAdmin;
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
       supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    } else {
       throw new Error("Supabase environment variables not configured for email sending.");
    }

    const formData: ContactFormData = await req.json();

    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.inquiryType || !formData.message) {
      return new Response(JSON.stringify({ error: 'Missing required form fields.' }), {
        status: 400,
        // Use dynamic headers for error response
        headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const subject = `New Contact Inquiry: ${formData.inquiryType} from ${formData.firstName} ${formData.lastName}`;
    const body = `
      You have received a new contact inquiry:

      Name: ${formData.firstName} ${formData.lastName}
      Email: ${formData.email}
      Phone: ${formData.phone || 'Not provided'}
      Inquiry Type: ${formData.inquiryType}

      Message:
      --------------------------------
      ${formData.message}
      --------------------------------
    `;

    // Note: Supabase Edge Functions currently don't have a built-in email client.
    // You typically need to call another service (like Resend, SendGrid, or another Supabase function designed for email)
    // OR use the Supabase client library to trigger a database hook/function that sends email if configured.
    // The following is a conceptual placeholder using a hypothetical `supabaseAdmin.sendEmail` method.
    // --- Start Resend Implementation ---
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY environment variable is not set.");
      throw new Error("Email configuration error: Resend API key is missing.");
    }

    // Use the FROM_EMAIL_ADDRESS environment variable. Ensure it's set in Supabase settings
    // and corresponds to a verified domain/email in Resend.
    const FROM_EMAIL = Deno.env.get('FROM_EMAIL_ADDRESS');
    if (!FROM_EMAIL) {
      console.error("FROM_EMAIL_ADDRESS environment variable is not set.");
      throw new Error("Email configuration error: Sending email address is missing.");
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${RESEND_API_KEY}`
        },
        body: JSON.stringify({
            from: FROM_EMAIL,
            to: [TO_EMAIL],
            cc: [CC_EMAIL],
            subject: subject,
            text: body, // Use text for simplicity, or 'html: body' if you format the body as HTML
        }),
    });

    if (!resendResponse.ok) {
        const errorData = await resendResponse.json();
        console.error("Resend API Error:", errorData);
        throw new Error(`Failed to send email via Resend: ${errorData.message || 'Unknown error'}`);
    }

    console.log("Email successfully sent via Resend.");
    // --- End Resend Implementation ---


    return new Response(JSON.stringify({ message: 'Inquiry sent successfully!' }), {
      // Use dynamic headers for success response
      headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      // Use dynamic headers for catch block error response
      headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
