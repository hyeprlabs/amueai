import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// PLACEHOLDER — no Upstash MCP connector was available when this was
// scaffolded, so this targets a generic Upstash Redis REST instance via
// the standard env vars rather than a verified real one. Re-check
// UPSTASH_REDIS_REST_URL/TOKEN against the actual instance once the MCP
// connector is available - see the build summary.
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 20 messages per minute per (IP, chatbot) pair - generous enough for a
// real conversation, tight enough to blunt a scripted flood against the
// public chat route, which has no other auth.
const chatRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  prefix: "amueai:chat",
});

export async function checkChatRateLimit(ip: string, chatbotId: string) {
  const { success } = await chatRatelimit.limit(`${ip}:${chatbotId}`);
  return success;
}
