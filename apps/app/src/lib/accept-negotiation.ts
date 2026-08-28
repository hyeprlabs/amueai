/**
 * RFC 7231 `Accept` header negotiation, scoped to the one decision this site
 * needs: does the client prefer `text/markdown` over `text/html`?
 *
 * Used to implement acceptmarkdown.com-style content negotiation — an agent
 * sends `Accept: text/markdown` and gets a markdown rendition of the page
 * instead of HTML.
 */

type MediaRange = { type: string; subtype: string; q: number };

function parseAccept(header: string): MediaRange[] {
  return header
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [mediaType, ...params] = part.split(";").map((s) => s.trim());
      const [type = "*", subtype = "*"] = (mediaType ?? "*/*").split("/");
      const qParam = params.find((p) => p.toLowerCase().startsWith("q="));
      const q = qParam ? Number.parseFloat(qParam.slice(2)) : 1;
      return { type, subtype, q: Number.isFinite(q) ? q : 1 };
    });
}

/**
 * Quality of the most specific match for `type/subtype`. Only an exact,
 * literal entry counts — a wildcard range never satisfies this. Without that
 * restriction, a wildcard-only header (curl's default Accept, or nothing at
 * all) would score `text/markdown` and `text/html` equally and incorrectly
 * read as "prefers markdown".
 */
function exactQualityFor(ranges: MediaRange[], type: string, subtype: string): number {
  let best = 0;
  for (const range of ranges) {
    if (range.type === type && range.subtype === subtype) best = Math.max(best, range.q);
  }
  return best;
}

/**
 * True only when the header explicitly names `text/markdown` with at least
 * as much preference as any explicit `text/html` entry — e.g.
 * `Accept: text/markdown`, or `Accept: text/markdown, text/html;q=0.5`.
 * A wildcard-only header (no header at all, or curl's default Accept) and a
 * browser's typical `Accept: text/html,application/xhtml+xml,...` both
 * return false: neither names markdown explicitly.
 */
export function prefersMarkdown(acceptHeader: string | null): boolean {
  if (!acceptHeader) return false;

  const ranges = parseAccept(acceptHeader);
  const markdownQ = exactQualityFor(ranges, "text", "markdown");
  if (markdownQ <= 0) return false;

  const htmlQ = exactQualityFor(ranges, "text", "html");
  return markdownQ >= htmlQ;
}

/**
 * True when `pathname` has a markdown rendition (see `src/lib/markdown-render.ts`
 * for the corresponding renderers).
 *
 * Deliberately dependency-free — the proxy that calls this runs before any
 * Payload/DB code can safely load, so this can only check the URL shape, not
 * whether a given slug actually exists. A non-existent slug under an
 * eligible shape still gets rewritten and comes back as a 404 from
 * `/api/markdown/*`, which is correct.
 */
export function isMarkdownEligiblePath(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return true;

  switch (segments[0]) {
    case "about":
    case "pricing":
    case "contact":
    case "developers":
    case "changelog":
    case "competitors":
      return segments.length === 1;
    case "features":
      return segments.length === 2 && (segments[1] === "agent" || segments[1] === "channels");
    case "blog":
      return segments.length === 1 || segments.length === 2;
    case "vs":
      return segments.length === 2;
    case "legal":
      return segments.length === 1 || segments.length === 2;
    default:
      return false;
  }
}
