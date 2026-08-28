import { siteConfig } from "@/config/site";
import { absoluteUrl } from "@/lib/seo";

/**
 * OpenAPI 3.1 description of the public `/api/v1/*` content API.
 *
 * Hand-written rather than generated: the route handlers are a handful of
 * simple, stable GET endpoints, and a static spec is easier to keep
 * trustworthy than a generator wired into a fast-moving CMS schema. Update
 * this alongside any change to `src/lib/api-v1-serializers.ts` or the
 * `src/app/api/v1/**` routes.
 */

const rateLimitHeaders = {
  "RateLimit-Limit": {
    description: "Requests allowed in the current window.",
    schema: { type: "integer" },
  },
  "RateLimit-Remaining": {
    description: "Requests remaining in the current window.",
    schema: { type: "integer" },
  },
  "RateLimit-Reset": {
    description: "Seconds until the current window resets.",
    schema: { type: "integer" },
  },
} as const;

const errorResponse = (description: string) => ({
  description,
  headers: rateLimitHeaders,
  content: {
    "application/json": { schema: { $ref: "#/components/schemas/Error" } },
  },
});

const rateLimited = {
  description: "Rate limit exceeded.",
  headers: {
    ...rateLimitHeaders,
    "Retry-After": {
      description: "Seconds to wait before retrying.",
      schema: { type: "integer" },
    },
  },
  content: {
    "application/json": { schema: { $ref: "#/components/schemas/Error" } },
  },
};

const pageParam = {
  name: "page",
  in: "query",
  description: "1-indexed page number.",
  required: false,
  schema: { type: "integer", minimum: 1, default: 1 },
};

const slugParam = (resource: string) => ({
  name: "slug",
  in: "path",
  description: `The ${resource}'s URL slug.`,
  required: true,
  schema: { type: "string" },
});

export function openApiDocument() {
  return {
    openapi: "3.1.0",
    info: {
      title: `${siteConfig.name} Content API`,
      version: "1.0.0",
      description:
        `Read-only, public REST API for ${siteConfig.name}'s published marketing content — blog posts, ` +
        "changelog entries, competitor comparisons, and legal pages. No authentication is required " +
        "and no request body is ever accepted; every operation is a GET. Responses are JSON and every " +
        "list is paginated. Agents and integrations should treat this as the canonical, machine-readable " +
        "source for this content instead of scraping rendered HTML.",
      contact: { name: `${siteConfig.name} support`, email: siteConfig.email, url: siteConfig.url },
      license: { name: "Content usage terms", url: absoluteUrl("/legal/terms") },
    },
    servers: [{ url: siteConfig.url, description: "Production" }],
    tags: [
      { name: "Posts", description: "Blog posts." },
      { name: "Changelog", description: "Product changelog entries." },
      { name: "Competitors", description: "Comparison pages against other products." },
      { name: "Legal", description: "Legal pages (terms, privacy, etc.)." },
    ],
    paths: {
      "/api/v1": {
        get: {
          operationId: "getApiIndex",
          tags: ["Posts", "Changelog", "Competitors", "Legal"],
          summary: "API index",
          description:
            "Self-describing index of the content API: version, OpenAPI URL, and the absolute URL of every endpoint below.",
          responses: {
            "200": {
              description: "The API index.",
              headers: rateLimitHeaders,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      version: { type: "string" },
                      openapi: { type: "string", format: "uri" },
                      documentation: { type: "string", format: "uri" },
                      endpoints: {
                        type: "object",
                        properties: {
                          posts: { type: "string", format: "uri" },
                          changelog: { type: "string", format: "uri" },
                          competitors: { type: "string", format: "uri" },
                          legalPages: { type: "string", format: "uri" },
                        },
                        required: ["posts", "changelog", "competitors", "legalPages"],
                      },
                    },
                    required: ["name", "version", "openapi", "documentation", "endpoints"],
                  },
                },
              },
            },
            "429": rateLimited,
          },
        },
      },
      "/api/v1/posts": {
        get: {
          operationId: "listPosts",
          tags: ["Posts"],
          summary: "List published blog posts",
          description:
            "Returns published blog posts, newest first. Supports pagination and filtering by category slug.",
          parameters: [
            pageParam,
            {
              name: "category",
              in: "query",
              description: "Only return posts in this category slug.",
              required: false,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "A page of posts.",
              headers: rateLimitHeaders,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { type: "array", items: { $ref: "#/components/schemas/Post" } },
                      meta: { $ref: "#/components/schemas/PageMeta" },
                    },
                    required: ["data", "meta"],
                  },
                },
              },
            },
            "429": rateLimited,
            "503": errorResponse("Content is temporarily unavailable."),
          },
        },
      },
      "/api/v1/posts/{slug}": {
        get: {
          operationId: "getPost",
          tags: ["Posts"],
          summary: "Get a single blog post by slug",
          parameters: [slugParam("post")],
          responses: {
            "200": {
              description: "The post.",
              headers: rateLimitHeaders,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { data: { $ref: "#/components/schemas/Post" } },
                    required: ["data"],
                  },
                },
              },
            },
            "404": errorResponse("No published post found for that slug."),
            "429": rateLimited,
            "503": errorResponse("Content is temporarily unavailable."),
          },
        },
      },
      "/api/v1/changelog": {
        get: {
          operationId: "listChangelogEntries",
          tags: ["Changelog"],
          summary: "List published changelog entries",
          description: "Returns published changelog entries, newest first.",
          parameters: [pageParam],
          responses: {
            "200": {
              description: "A page of changelog entries.",
              headers: rateLimitHeaders,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/ChangelogEntry" },
                      },
                      meta: { $ref: "#/components/schemas/PageMeta" },
                    },
                    required: ["data", "meta"],
                  },
                },
              },
            },
            "429": rateLimited,
            "503": errorResponse("Content is temporarily unavailable."),
          },
        },
      },
      "/api/v1/competitors": {
        get: {
          operationId: "listCompetitors",
          tags: ["Competitors"],
          summary: "List published competitor comparisons",
          description: "Returns published comparison pages, alphabetical by competitor name.",
          parameters: [pageParam],
          responses: {
            "200": {
              description: "A page of comparisons.",
              headers: rateLimitHeaders,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { type: "array", items: { $ref: "#/components/schemas/Competitor" } },
                      meta: { $ref: "#/components/schemas/PageMeta" },
                    },
                    required: ["data", "meta"],
                  },
                },
              },
            },
            "429": rateLimited,
            "503": errorResponse("Content is temporarily unavailable."),
          },
        },
      },
      "/api/v1/competitors/{slug}": {
        get: {
          operationId: "getCompetitor",
          tags: ["Competitors"],
          summary: "Get a single competitor comparison by slug",
          parameters: [slugParam("competitor")],
          responses: {
            "200": {
              description: "The comparison page.",
              headers: rateLimitHeaders,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { data: { $ref: "#/components/schemas/Competitor" } },
                    required: ["data"],
                  },
                },
              },
            },
            "404": errorResponse("No published comparison found for that slug."),
            "429": rateLimited,
            "503": errorResponse("Content is temporarily unavailable."),
          },
        },
      },
      "/api/v1/legal-pages": {
        get: {
          operationId: "listLegalPages",
          tags: ["Legal"],
          summary: "List all published legal pages",
          responses: {
            "200": {
              description: "Every published legal page.",
              headers: rateLimitHeaders,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { type: "array", items: { $ref: "#/components/schemas/LegalPage" } },
                    },
                    required: ["data"],
                  },
                },
              },
            },
            "429": rateLimited,
            "503": errorResponse("Content is temporarily unavailable."),
          },
        },
      },
      "/api/v1/legal-pages/{slug}": {
        get: {
          operationId: "getLegalPage",
          tags: ["Legal"],
          summary: "Get a single legal page by slug",
          parameters: [slugParam("legal page")],
          responses: {
            "200": {
              description: "The legal page.",
              headers: rateLimitHeaders,
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { data: { $ref: "#/components/schemas/LegalPage" } },
                    required: ["data"],
                  },
                },
              },
            },
            "404": errorResponse("No published legal page found for that slug."),
            "429": rateLimited,
            "503": errorResponse("Content is temporarily unavailable."),
          },
        },
      },
    },
    components: {
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: {
              type: "object",
              properties: { message: { type: "string" } },
              required: ["message"],
            },
          },
          required: ["error"],
        },
        PageMeta: {
          type: "object",
          properties: {
            page: { type: "integer" },
            limit: { type: "integer" },
            totalDocs: { type: "integer" },
            totalPages: { type: "integer" },
            hasNextPage: { type: "boolean" },
            hasPrevPage: { type: "boolean" },
          },
          required: ["page", "limit", "totalDocs", "totalPages", "hasNextPage", "hasPrevPage"],
        },
        Post: {
          type: "object",
          description: "A published blog post.",
          properties: {
            slug: { type: "string" },
            title: { type: "string" },
            excerpt: { type: "string" },
            content: { type: "string", description: "Plain-text rendering of the post body." },
            author: { type: ["string", "null"] },
            categories: { type: "array", items: { type: "string" } },
            image: { type: ["string", "null"], format: "uri" },
            publishedAt: { type: ["string", "null"], format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            url: { type: "string", format: "uri" },
          },
          required: [
            "slug",
            "title",
            "excerpt",
            "content",
            "author",
            "categories",
            "image",
            "publishedAt",
            "updatedAt",
            "url",
          ],
        },
        ChangelogEntry: {
          type: "object",
          description: "A published changelog entry.",
          properties: {
            slug: { type: "string" },
            title: { type: "string" },
            shortDescription: { type: "string" },
            type: { type: "string", enum: ["feature", "improvement", "fix", "breaking"] },
            version: { type: ["string", "null"] },
            content: { type: "string", description: "Plain-text rendering of the entry body." },
            publishedAt: { type: ["string", "null"], format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            url: { type: "string", format: "uri" },
          },
          required: [
            "slug",
            "title",
            "shortDescription",
            "type",
            "version",
            "content",
            "publishedAt",
            "updatedAt",
            "url",
          ],
        },
        Competitor: {
          type: "object",
          description: "A published `AmueAI vs. X` comparison page.",
          properties: {
            slug: { type: "string" },
            name: { type: "string" },
            excerpt: { type: "string" },
            verdict: { type: "string" },
            bestFor: { type: ["string", "null"] },
            website: { type: ["string", "null"], format: "uri" },
            updatedAt: { type: "string", format: "date-time" },
            url: { type: "string", format: "uri" },
          },
          required: [
            "slug",
            "name",
            "excerpt",
            "verdict",
            "bestFor",
            "website",
            "updatedAt",
            "url",
          ],
        },
        LegalPage: {
          type: "object",
          description: "A published legal page.",
          properties: {
            slug: { type: "string" },
            title: { type: "string" },
            content: { type: "string", description: "Plain-text rendering of the page body." },
            updatedAt: { type: "string", format: "date-time" },
            url: { type: "string", format: "uri" },
          },
          required: ["slug", "title", "content", "updatedAt", "url"],
        },
      },
    },
  } as const;
}
