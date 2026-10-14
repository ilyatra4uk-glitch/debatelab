import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function isSupabaseAuthConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function isSupabaseDatabaseConfigured() {
  return Boolean(supabaseUrl && supabaseServiceKey);
}

export function getSupabaseAuthClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase auth is not configured.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getSupabaseDatabaseClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase database is not configured.");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
