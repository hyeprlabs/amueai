import { NextResponse } from "next/server";

/**
 * Verifies the `Authorization: Bearer <token>` header against `BLOG_AGENT_TOKEN`.
 * Used by the /api/agent/* routes an external writing agent calls.
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
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined;

  if (!token || token !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
