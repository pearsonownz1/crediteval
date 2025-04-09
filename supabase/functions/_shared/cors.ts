// supabase/functions/_shared/cors.ts

// Define allowed origins
const allowedOrigins = [
  'https://crediteval.vercel.app', // Original Production frontend
  'https://crediteval-egbwb2d73-guy-gcsorgs-projects.vercel.app', // Previous Vercel deployment
  'https://crediteval-h3k27shge-guy-gcsorgs-projects.vercel.app', // Current Vercel deployment causing CORS error
  'http://localhost:5174',       // Local development frontend
  // Add other Vercel preview URLs if needed, or use a wildcard/regex if appropriate (more complex)
];

export function getAllowedCorsHeaders(requestOrigin: string | null): Record<string, string> {
  console.log("[CORS] Request Origin:", requestOrigin); // Log incoming origin
  console.log("[CORS] Allowed Origins:", allowedOrigins); // Log allowed list

  const headers: Record<string, string> = {
    // Allow common headers + custom ones if needed
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    // Allow necessary methods
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Check if the request origin is explicitly allowed
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    console.log(`[CORS] Origin ${requestOrigin} is allowed. Setting header.`);
    headers['Access-Control-Allow-Origin'] = requestOrigin;
  } else {
    console.warn(`[CORS] Origin ${requestOrigin} is NOT explicitly allowed. Not setting Access-Control-Allow-Origin header.`);
    // Do NOT set the header if the origin is not in the list.
    // The browser will block the request, which is the intended behavior for disallowed origins.
    // If testing locally and origin is null/unexpected, you might temporarily set it to '*'
    // headers['Access-Control-Allow-Origin'] = '*'; // Use with caution for debugging only
  }

  return headers;
}

// Remove the deprecated export as it uses the problematic fallback
// export const corsHeaders = { ... };
