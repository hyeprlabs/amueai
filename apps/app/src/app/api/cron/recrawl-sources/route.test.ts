import { beforeEach, describe, expect, it, vi } from "vitest";

const batchTriggerMock = vi.fn();
vi.mock("@trigger.dev/sdk", () => ({
  tasks: { batchTrigger: (...args: unknown[]) => batchTriggerMock(...args) },
}));

let fakeSupabase: ReturnType<typeof makeFakeSupabase>;
vi.mock("@/lib/supabase/server", () => ({
  createServiceRoleSupabaseClient: () => fakeSupabase,
}));

const { GET } = await import("./route");

function makeFakeSupabase(sources: Record<string, unknown>[]) {
  function from(_table: "sources") {
    const filters: Array<[string, unknown]> = [];
    const nullFilters: string[] = [];

    const builder = {
      select(_cols?: string) {
        return builder;
      },
      eq(col: string, val: unknown) {
        filters.push([col, val]);
        return builder;
      },
      is(col: string, _val: null) {
        nullFilters.push(col);
        return builder;
      },
      // oxlint-disable-next-line no-thenable
      then(onFulfilled: (result: { data: unknown; error: unknown }) => unknown) {
        const matched = sources.filter(
          (s) =>
            filters.every(([col, val]) => s[col] === val) &&
            nullFilters.every((col) => s[col] == null),
        );
        return Promise.resolve({ data: matched, error: null }).then(onFulfilled);
      },
    };

    return builder;
  }

  return { from };
}

function cronRequest() {
  return new Request("http://localhost/api/cron/recrawl-sources", {
    headers: { authorization: "Bearer test-cron-secret" },
  });
}

beforeEach(() => {
  batchTriggerMock.mockReset();
  process.env.CRON_SECRET = "test-cron-secret";
});

describe("GET /api/cron/recrawl-sources", () => {
  it("rejects a request without the correct bearer secret", async () => {
    fakeSupabase = makeFakeSupabase([]);

    const res = await GET(new Request("http://localhost/api/cron/recrawl-sources"));

    expect(res.status).toBe(401);
    expect(batchTriggerMock).not.toHaveBeenCalled();
  });

  it("batch-triggers a recrawl for every root url source, idempotent per week", async () => {
    fakeSupabase = makeFakeSupabase([
      {
        id: "root-1",
        org_id: "org-1",
        agent_id: "agent-1",
        url: "https://a.com",
        type: "url",
        parent_source_id: null,
      },
      {
        id: "root-2",
        org_id: "org-2",
        agent_id: "agent-2",
        url: "https://b.com",
        type: "url",
        parent_source_id: null,
      },
    ]);

    const res = await GET(cronRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.triggered).toBe(2);
    expect(batchTriggerMock).toHaveBeenCalledWith(
      "crawl-website",
      expect.arrayContaining([
        expect.objectContaining({
          payload: { sourceId: "root-1", orgId: "org-1", agentId: "agent-1", url: "https://a.com" },
          options: expect.objectContaining({
            idempotencyKeyTTL: "7d",
            tags: expect.arrayContaining(["recrawl"]),
          }),
        }),
      ]),
    );
  });

  it("skips root sources with no url", async () => {
    fakeSupabase = makeFakeSupabase([
      {
        id: "root-3",
        org_id: "org-1",
        agent_id: "agent-1",
        url: null,
        type: "url",
        parent_source_id: null,
      },
    ]);

    await GET(cronRequest());

    expect(batchTriggerMock).toHaveBeenCalledWith("crawl-website", []);
  });
});
