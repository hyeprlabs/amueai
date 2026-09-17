import { flag } from "flags/next";
import { vercelAdapter } from "@flags-sdk/vercel";

export const waitlistFlag = flag<boolean>({
  key: "waitlist",
  adapter: vercelAdapter,
  defaultValue: false,
});
