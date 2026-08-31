import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Redis.fromEnv() reads UPSTASH_REDIS_REST_URL/TOKEN if set, falling back
// to KV_REST_API_URL/TOKEN - the naming the Vercel Marketplace's Upstash
// integration provisions. This account uses the latter.
const redis = Redis.fromEnv();

// 20 messages per minute per (IP, agent) pair - generous enough for a
// real conversation, tight enough to blunt a scripted flood against the
// public chat route, which has no other auth.
const chatRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  prefix: "amueai:chat",
});

export async function checkChatRateLimit(ip: string, agentId: string) {
  const { success, reset } = await chatRatelimit.limit(`${ip}:${agentId}`);
  // `reset` is a real, exact unix-ms timestamp for this specific window,
  // unlike a provider-side "free tier" rate limit that has no such
  // schedule - only surface it when the check actually failed.
  return { success, retryAt: success ? undefined : reset };
}
