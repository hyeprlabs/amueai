import type { ReactNode } from "react";

import { ConsentManagerClient } from "./provider";

/** Thin server-safe wrapper so the root layout doesn't need `"use client"`. */
export function ConsentManager({ children }: { children: ReactNode }) {
  return <ConsentManagerClient>{children}</ConsentManagerClient>;
}
