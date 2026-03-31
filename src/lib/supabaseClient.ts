import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "./publicEnv";

export const supabase = createClient(
  publicEnv.supabaseUrl,
  publicEnv.supabaseAnonKey
);
