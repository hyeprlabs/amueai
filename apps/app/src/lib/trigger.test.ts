import { beforeEach, describe, expect, it, vi } from "vitest";

const triggerMock = vi.fn();
const createPublicTokenMock = vi.fn();
vi.mock("@trigger.dev/sdk", () => ({
  tasks: { trigger: (...args: unknown[]) => triggerMock(...args) },
  auth: { createPublicToken: (...args: unknown[]) => createPublicTokenMock(...args) },
}));

const { triggerIngestSource } = await import("./trigger");

beforeEach(() => {
  triggerMock.mockReset();
  createPublicTokenMock.mockReset();
});

describe("triggerIngestSource", () => {
  it("enqueues the ingest-source task and mints a token scoped to that run only", async () => {
    triggerMock.mockResolvedValue({ id: "run_123" });
    createPublicTokenMock.mockResolvedValue("pat_abc");

    const result = await triggerIngestSource("source-1");

    expect(triggerMock).toHaveBeenCalledWith("ingest-source", { sourceId: "source-1" });
    expect(createPublicTokenMock).toHaveBeenCalledWith({
      scopes: { read: { runs: ["run_123"] } },
    });
    expect(result).toEqual({ id: "run_123", publicAccessToken: "pat_abc" });
  });
});
