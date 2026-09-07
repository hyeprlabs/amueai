import { beforeEach, describe, expect, it, vi } from "vitest";

const readFileMock = vi.fn();
vi.mock("node:fs/promises", () => ({
  readFile: (...args: unknown[]) => readFileMock(...args),
}));

const { GET } = await import("./route");

beforeEach(() => {
  readFileMock.mockReset();
});

describe("GET /widget.js", () => {
  it("redirects to the content-hashed build named in the manifest, short-cached", async () => {
    readFileMock.mockResolvedValueOnce(JSON.stringify({ file: "widget.abc123.js" }));

    const res = await GET(new Request("https://amueai.com/widget.js"));

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://amueai.com/widget.abc123.js");
    expect(res.headers.get("cache-control")).toBe("public, max-age=300");
  });

  it("falls back to serving the source directly when no manifest exists (dev, no build run)", async () => {
    readFileMock.mockRejectedValueOnce(new Error("ENOENT"));
    readFileMock.mockResolvedValueOnce("(function () { /* widget source */ })();");

    const res = await GET(new Request("https://amueai.com/widget.js"));

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/javascript");
    expect(await res.text()).toContain("widget source");
  });
});
