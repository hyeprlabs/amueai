import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbJsonLd, JsonLdScript, OrganizationJsonLd } from "next-seo";
import { ArrowUpRightIcon } from "lucide-react";

import { CallToAction } from "@/components/marketing/cta";
import { FullWidthDivider } from "@/components/full-width-divider";
import { PageHero, SectionHeading } from "@/components/marketing/page-hero";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import {
  breadcrumbItems,
  organizationJsonLdProps,
  webPageJsonLd,
  webSiteJsonLd,
} from "@/lib/next-seo";
import { absoluteUrl, createMetadata } from "@/lib/seo";

const title = "Developers";
const description = `${siteConfig.name} developer docs: the public content API, OpenAPI specification, authentication, rate limits, and example requests.`;
const pathname = "/developers";

export const metadata: Metadata = createMetadata({ title, description, pathname });

const endpoints = [
  { method: "GET", path: "/api/v1/posts", description: "List published blog posts." },
  { method: "GET", path: "/api/v1/posts/{slug}", description: "Get a single blog post." },
  { method: "GET", path: "/api/v1/changelog", description: "List published changelog entries." },
  { method: "GET", path: "/api/v1/competitors", description: "List published comparison pages." },
  {
    method: "GET",
    path: "/api/v1/competitors/{slug}",
    description: "Get a single comparison page.",
  },
  { method: "GET", path: "/api/v1/legal-pages", description: "List every published legal page." },
  { method: "GET", path: "/api/v1/legal-pages/{slug}", description: "Get a single legal page." },
] as const;

const machineReadableResources = [
  {
    href: "/openapi.json",
    label: "OpenAPI specification",
    description: "Full schema for every endpoint below.",
  },
  {
    href: "/llms.txt",
    label: "llms.txt",
    description: "Plain-text page index and usage guidance for AI agents.",
  },
  { href: "/sitemap.xml", label: "Sitemap", description: "Every indexable URL on the site." },
] as const;

export default function DevelopersPage() {
  return (
    <>
      <OrganizationJsonLd {...organizationJsonLdProps()} scriptKey="organization" />
      <JsonLdScript data={webSiteJsonLd()} scriptKey="website" />
      <JsonLdScript
        data={webPageJsonLd({ name: title, description, pathname })}
        scriptKey="webpage"
      />
      <BreadcrumbJsonLd
        items={breadcrumbItems([
          { name: "Home", pathname: "/" },
          { name: title, pathname },
        ])}
        scriptKey="breadcrumb"
      />

      <PageHero
        description={`Everything you need to integrate with ${siteConfig.name} programmatically — the public content API, its OpenAPI spec, and how agents should discover and call it.`}
        title={`${siteConfig.name} API for developers`}
      >
        <Button render={<a href="/openapi.json" />}>
          View OpenAPI spec
          <ArrowUpRightIcon aria-hidden data-icon="inline-end" />
        </Button>
      </PageHero>

      <section className="mb-12 lg:mb-24">
        <SectionHeading
          description="No API key or authentication is required. Every route is read-only (GET) and returns JSON."
          title="Authentication"
        />
        <div className="relative">
          <FullWidthDivider className="-top-px" />
          <p className="bg-background p-6 text-muted-foreground text-sm md:p-8">
            The {siteConfig.name} content API is public: it serves the same blog posts, changelog
            entries, comparison pages, and legal pages that are published on the site, so there is
            nothing to authenticate. If you need programmatic access to account or agent data inside
            the {siteConfig.name} product itself, contact{" "}
            <a className="underline underline-offset-4" href={`mailto:${siteConfig.email}`}>
              {siteConfig.email}
            </a>
            .
          </p>
          <FullWidthDivider className="-bottom-px" />
        </div>
      </section>

      <section className="mb-12 lg:mb-24">
        <SectionHeading description="Base URL: this site's origin." title="Endpoints" />
        <div className="relative overflow-x-auto">
          <FullWidthDivider className="-top-px" />
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b bg-background">
                <th className="p-3 font-medium text-muted-foreground" scope="col">
                  Method
                </th>
                <th className="p-3 font-medium text-muted-foreground" scope="col">
                  Path
                </th>
                <th className="p-3 font-medium text-muted-foreground" scope="col">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map((endpoint) => (
                <tr className="border-b bg-background last:border-b-0" key={endpoint.path}>
                  <td className="p-3 font-mono text-xs">{endpoint.method}</td>
                  <td className="p-3 font-mono text-xs">{endpoint.path}</td>
                  <td className="p-3 text-muted-foreground">{endpoint.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <FullWidthDivider className="-bottom-px" />
        </div>
      </section>

      <section className="mb-12 lg:mb-24">
        <SectionHeading title="Example request" />
        <div className="relative">
          <FullWidthDivider className="-top-px" />
          <pre className="overflow-x-auto bg-background p-6 font-mono text-xs md:p-8">
            <code>{`curl "${absoluteUrl("/api/v1/posts?page=1")}"

{
  "data": [
    {
      "slug": "example-post",
      "title": "Example post",
      "excerpt": "...",
      "content": "...",
      "author": "Jane Doe",
      "categories": ["Guides"],
      "image": "https://.../image.png",
      "publishedAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z",
      "url": "${absoluteUrl("/blog/example-post")}"
    }
  ],
  "meta": { "page": 1, "limit": 12, "totalDocs": 1, "totalPages": 1, "hasNextPage": false, "hasPrevPage": false }
}`}</code>
          </pre>
          <FullWidthDivider className="-bottom-px" />
        </div>
      </section>

      <section className="mb-12 lg:mb-24">
        <SectionHeading
          description="Every response carries these headers so a caller can self-throttle instead of guessing."
          title="Rate limits"
        />
        <div className="relative">
          <FullWidthDivider className="-top-px" />
          <ul className="bg-background p-6 text-sm md:p-8">
            <li className="flex justify-between gap-4 border-b py-2">
              <code className="font-mono text-xs">RateLimit-Limit</code>
              <span className="text-muted-foreground">Requests allowed per window</span>
            </li>
            <li className="flex justify-between gap-4 border-b py-2">
              <code className="font-mono text-xs">RateLimit-Remaining</code>
              <span className="text-muted-foreground">Requests left in the current window</span>
            </li>
            <li className="flex justify-between gap-4 border-b py-2">
              <code className="font-mono text-xs">RateLimit-Reset</code>
              <span className="text-muted-foreground">Seconds until the window resets</span>
            </li>
            <li className="flex justify-between gap-4 py-2">
              <code className="font-mono text-xs">Retry-After</code>
              <span className="text-muted-foreground">
                Sent with a 429 response — seconds to wait before retrying
              </span>
            </li>
          </ul>
          <FullWidthDivider className="-bottom-px" />
        </div>
      </section>

      <section className="mb-12 lg:mb-24">
        <SectionHeading
          description="Structured, machine-readable ways to discover this API and the rest of the site."
          title="For agents and integrations"
        />
        <div className="relative">
          <FullWidthDivider className="-top-px" />
          <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-3">
            {machineReadableResources.map((resource) => (
              <Link
                className="group bg-background p-6 transition-colors hover:bg-secondary/50"
                href={resource.href}
                key={resource.href}
              >
                <span className="flex items-center gap-1 font-medium text-sm">
                  {resource.label}
                  <ArrowUpRightIcon
                    aria-hidden
                    className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </span>
                <span className="mt-1 block text-muted-foreground text-xs">
                  {resource.description}
                </span>
              </Link>
            ))}
          </div>
          <FullWidthDivider className="-bottom-px" />
        </div>
      </section>

      <CallToAction />
    </>
  );
}
