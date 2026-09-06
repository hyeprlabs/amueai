-- sources/chunks/conversations somehow ended up with full table grants to
-- anon (agents/messages never did) - a leftover asymmetry from an earlier
-- migration. No policy targets "anon" on any of these tables, so RLS
-- already blocks it in practice, but there's no reason for the grant to
-- exist at all: every read/write on these tables goes through either an
-- authenticated Clerk session or the service-role key, never the
-- anonymous public key. Revoking it removes needless surface area rather
-- than relying solely on RLS staying correct forever.
revoke all on public.sources from anon;
revoke all on public.chunks from anon;
revoke all on public.conversations from anon;
