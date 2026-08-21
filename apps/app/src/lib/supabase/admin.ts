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
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

// Non-null assertions would hand `undefined` to createClient, which fails much
// later with an opaque fetch error against the URL "undefined".
if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set.");
if (!supabaseSecretKey) throw new Error("SUPABASE_SECRET_KEY is not set.");

export const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
