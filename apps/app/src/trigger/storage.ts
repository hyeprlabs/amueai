import { Files } from "files-sdk";
import { supabase as supabaseStorageAdapter } from "files-sdk/supabase";

export const files = new Files({
  adapter: supabaseStorageAdapter({
    bucket: "sources",
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key: process.env.SUPABASE_SECRET_KEY!,
  }),
});
