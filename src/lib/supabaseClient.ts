import { createClient } from '@supabase/supabase-js'

// Replace with your actual Supabase URL and Anon Key
const supabaseUrl = 'https://lholxkbtosixszauuzmb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxob2x4a2J0b3NpeHN6YXV1em1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwOTA5NjMsImV4cCI6MjA1OTY2Njk2M30.8G29BJdulSn_23JE1yfGcpgMwaGuA5ni7PEf6kZwrwk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
