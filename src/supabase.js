import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hfyuthryxzrsvkbfagbd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmeXV0aHJ5eHpyc3ZrYmZhZ2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzMTM5NzcsImV4cCI6MjA1NTg4OTk3N30.CcQpt9bTpRc3QpSslDhKMHOEPuMloxchmW9jK71MmCE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});