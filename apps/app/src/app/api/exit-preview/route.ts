import { draftMode, headers } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Leaves Draft Mode and returns the editor to the page they were previewing.
 *
 * The destination comes from the `Referer` header and is accepted only when it
 * points at this site, so the route can never be used as an open redirect.
 */
async function returnPath(): Promise<string> {
  const referer = (await headers()).get("referer");
  if (!referer) return "/";

  try {
    const url = new URL(referer);
    const host = (await headers()).get("host");
    if (host && url.host !== host) return "/";
    return `${url.pathname}${url.search}`;
  } catch {
    return "/";
  }
}

export async function GET() {
  const path = await returnPath();

  const draft = await draftMode();
  draft.disable();

  redirect(path);
}
