import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const chatRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  prefix: "amueai:chat",
});

export async function checkChatRateLimit(ip: string, agentId: string) {
  const { success, reset } = await chatRatelimit.limit(`${ip}:${agentId}`);
  return { success, retryAt: success ? undefined : reset };
}
