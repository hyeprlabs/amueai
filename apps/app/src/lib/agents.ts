import { redirect } from "next/navigation";

export function requireAgent<T>(agent: T | null | undefined): T {
  if (!agent) redirect("/agents");
  return agent;
}
