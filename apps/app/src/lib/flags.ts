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
 * `/blog` A/B test — rollout is managed in the Vercel Flags dashboard: `false`
 * keeps `BlogSectionA` (classic list), `true` shows `BlogSectionB` (image
 * grid). Bucketing is sticky per visitor via `BLOG_VISITOR_COOKIE`, which the
 * proxy assigns on first visit.
 */
export const blogSectionFlag = flag<boolean, BlogSectionEntities>({
  key: "blog-section",
  adapter: vercelAdapter,
  identify: identifyBlogVisitor,
  defaultValue: false,
});
