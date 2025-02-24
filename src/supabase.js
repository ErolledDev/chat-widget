import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if we're in development mode
const isDevelopment = import.meta.env.MODE === 'development';

if (!supabaseUrl || !supabaseAnonKey) {
  if (isDevelopment) {
    console.warn(
      'Missing Supabase environment variables. Please check your .env file.'
    );
  }
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  supabaseUrl || 'fallback-url-for-dev',
  supabaseAnonKey || 'fallback-key-for-dev',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  }
);