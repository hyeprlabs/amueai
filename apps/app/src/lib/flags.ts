import { dedupe, flag } from "flags/next";
import { vercelAdapter } from "@flags-sdk/vercel";
import type { ReadonlyRequestCookies } from "flags";

import { BLOG_VISITOR_COOKIE } from "@/lib/blog-visitor-cookie";

export const waitlistFlag = flag<boolean>({
  key: "waitlist",
  adapter: vercelAdapter,
  defaultValue: false,
});

interface BlogSectionEntities {
  // Vercel's project-level entity schema only knows "user" and "team", so an
  // anonymous blog visitor is bucketed as a "user" for rollout purposes.
  user?: { id: string };
}

const identifyBlogVisitor = dedupe(
  ({ cookies }: { cookies: ReadonlyRequestCookies }): BlogSectionEntities => {
    const id = cookies.get(BLOG_VISITOR_COOKIE)?.value;
    return { user: id ? { id } : undefined };
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
