import { Files } from "files-sdk";
import { supabase } from "files-sdk/supabase";

import type { SourceRef } from "./source";

export const files = new Files({
  adapter: supabase({
    bucket: "sources",
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key: process.env.SUPABASE_SECRET_KEY!,
  }),
});

export function markdownKey({ orgId, agentId, sourceId }: SourceRef) {
  return `${orgId}/${agentId}/${sourceId}.md`;
}
