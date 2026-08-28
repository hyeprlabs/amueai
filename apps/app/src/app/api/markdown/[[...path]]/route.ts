import { renderMarkdown } from "@/lib/markdown-render";

export const revalidate = 300;

/**
 * Backs the markdown variant of every Accept-negotiable page.
 *
 * `middleware.ts` rewrites a request for e.g. `/blog/my-post` with
 * `Accept: text/markdown` to `/api/markdown/blog/my-post`; this handler
 * renders that page's markdown. Never hit directly by a browser navigation —
 * only reached through the middleware rewrite, which is also where the
 * `Vary: Accept` header for these responses gets set.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path?: string[] }> },
): Promise<Response> {
  const { path = [] } = await params;
  const pathname = `/${path.join("/")}`;

  const markdown = await renderMarkdown(pathname);
  if (markdown === null) {
    return new Response(`# Not found\n\nNo markdown rendition exists for \`${pathname}\`.\n`, {
      status: 404,
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  }

  return new Response(`${markdown}\n`, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
