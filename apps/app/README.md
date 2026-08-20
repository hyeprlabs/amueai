This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## SEO

`NEXT_PUBLIC_SITE_URL` must be set to the public origin in every deployed
environment — canonical URLs, Open Graph tags, `robots.txt` and the sitemap are
all built from it, and it falls back to `http://localhost:3000` when unset.

| Concern                                                         | Location                                                                      |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Site-wide constants (name, description, socials, theme colours) | `src/config/site.ts`                                                          |
| Per-page metadata helper                                        | `src/lib/seo.ts`                                                              |
| schema.org structured data                                      | `src/lib/structured-data.ts`, rendered by `src/components/json-ld.tsx`        |
| Social card                                                     | `src/app/(app)/og/route.tsx`, addressed via `src/lib/og-image.ts`             |
| `robots.txt`, `sitemap.xml`, `manifest.webmanifest`             | `src/app/`                                                                    |
| Favicon and app icons                                           | `src/app/(app)/icon.svg`, `src/app/(app)/apple-icon.png`, `public/icon-*.png` |

Every page builds its metadata through `createMetadata`, which restates the
nested `openGraph` and `twitter` objects on purpose: Next.js merges metadata
shallowly, so a partial object replaces the root layout's instead of extending
it. Pages that must stay out of search results (auth and dashboard routes) pass
`noIndex: true` and are also disallowed in `robots.txt`.

The sitemap lists the marketing routes plus every published legal page from
Payload, and revalidates hourly. If Payload is unreachable — for example during
a build without a database — it logs and falls back to the static routes rather
than failing the build.

## Authentication

Clerk protects the dashboard routes from `src/proxy.ts`. `clerkMiddleware()` on
its own only makes auth state available — it enforces nothing — so every
private route is listed in `isProtectedRoute` and gated with `auth.protect()`.
Adding a dashboard route means adding it to that matcher.

`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` must be set **in the build environment**,
not only at runtime. It is inlined into statically prerendered HTML; without it
Clerk never emits its browser loader, so `ClerkLoaded` never resolves and every
Clerk component renders nothing — while the middleware still redirects
correctly, which makes the site look healthy. `next build` now fails fast rather
than shipping that state.
