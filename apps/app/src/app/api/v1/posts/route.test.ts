import { afterEach, describe, expect, it, vi } from "vitest";

import { resetRateLimitState } from "@/lib/api-rate-limit";

const { getPostsMock } = vi.hoisted(() => ({ getPostsMock: vi.fn() }));

vi.mock("@/lib/blog", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/blog")>();
  return { ...actual, getPosts: getPostsMock };
});

afterEach(() => {
  getPostsMock.mockReset();
  resetRateLimitState();
});

function jsonPostsRequest(ip = "198.51.100.1", accept = "application/json"): Request {
  return new Request("https://example.com/api/v1/posts", {
    headers: { "x-forwarded-for": ip, accept },
  });
}

describe("GET /api/v1/posts", () => {
  it("serializes posts and pagination meta on success", async () => {
    getPostsMock.mockResolvedValue({
      docs: [
        {
          slug: "hello-world",
          title: "Hello world",
          excerpt: "An excerpt.",
          content: {
            root: {
              type: "root",
              children: [],
              direction: "ltr",
              format: "",
              indent: 0,
              version: 1,
            },
          },
          author: { name: "Jane" },
          categories: [],
          featuredImage: { url: "/img.png", alt: "" },
          publishedAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      page: 1,
      limit: 12,
      totalDocs: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    });

    const { GET } = await import("@/app/api/v1/posts/route");
    const response = await GET(jsonPostsRequest());

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].slug).toBe("hello-world");
    expect(body.data[0].author).toBe("Jane");
    expect(body.meta.totalDocs).toBe(1);
  });

  it("returns 503 with an error body when the CMS is unreachable", async () => {
    getPostsMock.mockRejectedValue(new Error("connect ECONNREFUSED"));

    const { GET } = await import("@/app/api/v1/posts/route");
    const response = await GET(jsonPostsRequest("198.51.100.2"));

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error.message).toBeTruthy();
  });

  it("returns 429 with Retry-After once the rate limit is exceeded", async () => {
    getPostsMock.mockResolvedValue({
      docs: [],
      page: 1,
      limit: 12,
      totalDocs: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    });

    const { GET } = await import("@/app/api/v1/posts/route");
    const ip = "198.51.100.3";

    let last: Response | undefined;
    for (let i = 0; i < 61; i++) {
      last = await GET(jsonPostsRequest(ip));
    }

    expect(last?.status).toBe(429);
    expect(last?.headers.get("Retry-After")).toBeTruthy();
  });
});
