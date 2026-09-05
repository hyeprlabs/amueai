import { dedupe, flag } from "flags/next";
import { vercelAdapter } from "@flags-sdk/vercel";
import type { ReadonlyRequestCookies } from "flags";

export const waitlistFlag = flag<boolean>({
  key: "waitlist",
  adapter: vercelAdapter,
  defaultValue: false,
});

/** Cookie set by the proxy so a visitor keeps seeing the same `/blog` variant on repeat visits. */
export const BLOG_VISITOR_COOKIE = "blog-visitor-id";

interface BlogSectionEntities {
  visitor?: { id: string };
}

const identifyBlogVisitor = dedupe(
  ({ cookies }: { cookies: ReadonlyRequestCookies }): BlogSectionEntities => {
    const id = cookies.get(BLOG_VISITOR_COOKIE)?.value;
    return { visitor: id ? { id } : undefined };
  },
);

/**
 * `/blog` A/B test — 50% of visitors get `BlogSectionB` (image grid), the rest
 * keep `BlogSectionA` (classic list). Bucketing is sticky per visitor via
 * `BLOG_VISITOR_COOKIE`, which the proxy assigns on first visit.
 */
export const blogSectionFlag = flag<boolean, BlogSectionEntities>({
  key: "blog-section-b",
  description: "/blog A/B test: variant B (image grid) vs variant A (classic list).",
  identify: identifyBlogVisitor,
  decide({ entities }) {
    if (!entities?.visitor) return false;
    // A v4 UUID's first hex digit is uniform over 16 values, so this covers exactly half.
    return /^[0-7]/i.test(entities.visitor.id);
  },
  options: [
    { value: false, label: "A — classic list" },
    { value: true, label: "B — image grid" },
  ],
  defaultValue: false,
});
