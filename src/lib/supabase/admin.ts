import { createClient } from "@supabase/supabase-js";
import "server-only";

/** Cliente com secret key: ignora RLS. Usar apenas no servidor. */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
