import { createClient } from '@supabase/supabase-js';

// Retrieve environment variables
const envUrl = process.env.SUPABASE_URL;
const envKey = process.env.SUPABASE_ANON_KEY;

// Check if configured (for UI warnings)
export const isSupabaseConfigured = !!envUrl && !!envKey && envUrl !== '' && envKey !== '';

// Use fallbacks to prevent "supabaseUrl is required" error during initialization
// This allows the app to render even if keys are missing (auth will just fail gracefully)
const supabaseUrl = envUrl || 'https://placeholder.supabase.co';
const supabaseAnonKey = envKey || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
