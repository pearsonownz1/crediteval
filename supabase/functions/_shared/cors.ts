// Standard CORS headers for Supabase Edge Functions
// Allows requests from any origin. For production, you might want to restrict
// this to your specific frontend domain (e.g., 'https://www.crediteval.com').
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Allow all origins
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", // Allow common headers
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE", // Allow common methods
};
