// supabase/functions/_shared/cors.ts

// Define allowed origins
const allowedOrigins = [
  'https://www.crediteval.com', // New Production frontend (www)
  'https://crediteval.com',     // New Production frontend (root)
  'http://localhost:5173',      // Default local dev port
  'http://localhost:5174',      // Possible local dev port
  'http://localhost:5175',      // Current local dev port
  // Add specific Vercel preview URLs if needed for testing
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
