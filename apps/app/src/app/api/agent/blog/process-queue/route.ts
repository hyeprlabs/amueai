import config from "@payload-config";
import { NextResponse } from "next/server";
import { getPayload } from "payload";

import { verifyAgentToken } from "@/lib/agent-auth";
import { createAgentBlogPost, validateAgentPostInput, type CreateAgentPostInput } from "@/lib/agent-blog";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type QueueRow = {
  id: string;
  payload: CreateAgentPostInput;
};

/**
 * Drains `agent_blog_queue`, a plain (non-Payload) table the writing agent
 * inserts finished articles into directly via SQL. This exists because the
 * agent's sandbox can't make arbitrary outbound HTTPS calls (including a
 * POST to `/api/agent/blog/posts`) — it can only reach this app through the
 * Vercel platform's own URL-fetch tooling, which is GET-only and can't set
 * an Authorization header. So the agent writes rows via a SQL MCP tool
 * instead, and this route — running on Vercel, with normal outbound access —
 * does the actual creation (fetching each featured image, converting
 * markdown, calling Payload) using the same logic as the POST route.
 */
export async function GET(request: Request) {
  const unauthorized = verifyAgentToken(request);
  if (unauthorized) return unauthorized;

  const payload = await getPayload({ config });
  const pool = payload.db.pool;

  const { rows } = await pool.query<QueueRow>(
    `select id, payload from agent_blog_queue where status = 'pending' order by created_at asc limit 10`,
  );

  const results: Array<{ id: string; ok: boolean; error?: string; post?: unknown }> = [];

  for (const row of rows) {
    const validationError = validateAgentPostInput(row.payload);
    if (validationError) {
      await pool.query(
        `update agent_blog_queue set status = 'failed', error = $2, processed_at = now() where id = $1`,
        [row.id, validationError],
      );
      results.push({ id: row.id, ok: false, error: validationError });
      continue;
    }

    try {
      const post = await createAgentBlogPost(payload, row.payload);
      await pool.query(
        `update agent_blog_queue set status = 'processed', processed_at = now() where id = $1`,
        [row.id],
      );
      results.push({ id: row.id, ok: true, post });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create post.";
      console.error(`[agent/blog/process-queue] Failed to create post for row ${row.id}:`, error);
      await pool.query(
        `update agent_blog_queue set status = 'failed', error = $2, processed_at = now() where id = $1`,
        [row.id, message],
      );
      results.push({ id: row.id, ok: false, error: message });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
