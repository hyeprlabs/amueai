import "server-only";

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

/**
 * Authenticated dashboard routes only. RLS evaluates `auth.jwt()->>'org_id'`
 * from the Clerk session token, so this is the tenant boundary — never
 * swap in the service-role key here for convenience.
 */
export function createServerSupabaseClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      async accessToken() {
        return (await auth()).getToken();
      },
    },
  );
}

/**
 * Bypasses RLS entirely. Reserved for the two documented exceptions: the
 * public `/api/chat/[chatbotId]` route and the ingestion task — neither
 * runs under a live Clerk session. Every other route must use
 * `createServerSupabaseClient`.
 */
export function createServiceRoleSupabaseClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
