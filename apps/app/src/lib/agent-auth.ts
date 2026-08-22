import { NextResponse } from "next/server";

/**
 * Verifies the request against `BLOG_AGENT_TOKEN`, accepted either as an
 * `Authorization: Bearer <token>` header or a `?token=` query param. The
 * query param exists for GET routes triggered by callers that can't set
 * custom headers (e.g. a URL-only fetch tool) — used by
 * `/api/agent/blog/process-queue`.
 */
export function verifyAgentToken(request: Request): NextResponse | null {
  const expected = process.env.BLOG_AGENT_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { error: "BLOG_AGENT_TOKEN is not configured on the server." },
      { status: 500 },
    );
  }

  const authorization = request.headers.get("authorization");
  const headerToken = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined;
  const queryToken = new URL(request.url).searchParams.get("token") ?? undefined;
  const token = headerToken ?? queryToken;

  if (!token || token !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
