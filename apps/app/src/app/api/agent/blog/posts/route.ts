import config from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

import { verifyAgentToken } from "@/lib/agent-auth";
import {
  createAgentBlogPost,
  validateAgentPostInput,
  type CreateAgentPostInput,
} from "@/lib/agent-blog";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Ingestion endpoint for an external writing agent: given a finished article
 * (markdown + metadata), creates the Blog post (plus any new categories,
 * tags, or author it needs). See `@/lib/agent-blog` for the creation logic
 * shared with the queue-drain route at `/api/agent/blog/process-queue`.
 */
export async function POST(request: Request) {
  const unauthorized = verifyAgentToken(request);
  if (unauthorized) return unauthorized;

  let body: CreateAgentPostInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validationError = validateAgentPostInput(body);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const payload = await getPayload({ config });

  try {
    const result = await createAgentBlogPost(payload, body);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[agent/blog/posts] Failed to create post:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create post." },
      { status: 500 },
    );
  }
}
