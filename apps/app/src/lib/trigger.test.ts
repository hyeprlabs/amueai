import { beforeEach, describe, expect, it, vi } from "vitest";

const triggerMock = vi.fn();
const createPublicTokenMock = vi.fn();
vi.mock("@trigger.dev/sdk", () => ({
  tasks: { trigger: (...args: unknown[]) => triggerMock(...args) },
  auth: { createPublicToken: (...args: unknown[]) => createPublicTokenMock(...args) },
}));

const { triggerIngestion } = await import("./trigger");

beforeEach(() => {
  triggerMock.mockReset();
  createPublicTokenMock.mockReset();
  createPublicTokenMock.mockResolvedValue("pat_abc");
});

describe("triggerIngestion", () => {
  it("dispatches a url source to crawl-website, tagged and idempotent", async () => {
    const result = await triggerIngestion({
      id: "source-1",
      orgId: "org-1",
      agentId: "agent-1",
      type: "url",
      url: "https://example.com",
      label: "Example",
    });

    expect(triggerMock).toHaveBeenCalledWith(
      "crawl-website",
      { sourceId: "source-1", orgId: "org-1", agentId: "agent-1", url: "https://example.com" },
      expect.objectContaining({
        tags: ["org:org-1", "agent:agent-1", "source:source-1"],
        idempotencyKey: "crawl-source-1-v1",
      }),
    );
    expect(createPublicTokenMock).toHaveBeenCalledWith({
      scopes: { read: { tags: ["source:source-1"] } },
      expirationTime: "1h",
    });
    expect(result).toEqual({ tag: "source:source-1", publicAccessToken: "pat_abc" });
  });

  it("dispatches a file source to ingest-source", async () => {
    await triggerIngestion({
      id: "source-2",
      orgId: "org-1",
      agentId: "agent-1",
      type: "file",
      storagePath: "org-1/agent-1/handbook.pdf",
      label: "Handbook",
    });

    expect(triggerMock).toHaveBeenCalledWith(
      "ingest-source",
      expect.objectContaining({
        sourceId: "source-2",
        type: "file",
        storagePath: "org-1/agent-1/handbook.pdf",
      }),
      expect.objectContaining({ tags: ["org:org-1", "agent:agent-1", "source:source-2"] }),
    );
  });

  it("dispatches a text source to ingest-source", async () => {
    await triggerIngestion({
      id: "source-3",
      orgId: "org-1",
      agentId: "agent-1",
      type: "text",
      rawContent: "hello world",
      label: "Notes",
    });

    expect(triggerMock).toHaveBeenCalledWith(
      "ingest-source",
      expect.objectContaining({ sourceId: "source-3", type: "text", rawContent: "hello world" }),
      expect.anything(),
    );
  });
});
