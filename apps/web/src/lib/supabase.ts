import { createClient } from '@supabase/supabase-js';

// Mặc định: persistSession + autoRefreshToken (JWT 1h tự refresh), detectSessionInUrl sau OAuth.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

export async function getAccessToken(): Promise<string | undefined> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}
