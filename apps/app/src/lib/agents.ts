import { redirect } from "next/navigation";

/**
 * Guards an org-scoped agent lookup.
 *
 * Every agent query runs through RLS scoped to the caller's active Clerk
 * org, so "no row" means either the agent genuinely doesn't exist or it
 * belongs to another org. Both look identical from here, and both are
 * reached the same way in practice: switching orgs while sitting on
 * `/agents/<id>/...` silently re-scopes the query and the row vanishes.
 *
 * Sending that to a 404 dead-ends the user on a page they can't act on, so
 * every case lands back on the agents list of whichever org is now active -
 * which is exactly where they'd navigate next anyway.
 */
export function requireAgent<T>(agent: T | null | undefined): T {
  if (!agent) redirect("/agents");
  return agent;
}
