const FALLBACK_SUPABASE_URL = "https://lholxkbtosixszauuzmb.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxob2x4a2J0b3NpeHN6YXV1em1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwOTA5NjMsImV4cCI6MjA1OTY2Njk2M30.8G29BJdulSn_23JE1yfGcpgMwaGuA5ni7PEf6kZwrwk";
const FALLBACK_STRIPE_PUBLISHABLE_KEY = "pk_live_5vKOii6RstRUd7bpww7zaSof";

export const publicEnv = {
  stripePublishableKey:
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    FALLBACK_STRIPE_PUBLISHABLE_KEY,
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL,
  supabaseAnonKey:
    import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY,
} as const;
