import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Privileged Supabase client using the project's new-format SECRET key
 * (Supabase deprecated the legacy anon/service_role JWT pair in favor of
 * publishable/secret keys — this plays the same role the service_role key
 * used to: it bypasses RLS entirely). Fine here because billing tables
 * (organizations, webhook_events, chatbots, messages) deny anon/authenticated
 * outright at the grant level — this is the only client allowed to touch them.
 *
 * Never import this file from a Client Component. `server-only` throws a
 * build error if that happens.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
