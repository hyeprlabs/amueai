/**
 * Fails the build when Clerk is not configured.
 *
 * `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is inlined into statically prerendered
 * HTML at *build* time. Without it Clerk never emits its browser loader, so
 * `ClerkLoaded` never resolves and every Clerk component — `SignIn`, `SignUp`,
 * `UserButton`, `Show` — silently renders nothing, even when the key is present
 * at runtime. Setting it only as a runtime variable produces a site that looks
 * healthy but has no working auth UI, so the build has to reject it outright.
 */
const requiredAtBuildTime = ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"] as const;

export function assertBuildEnv(): void {
  // `next dev` reads the key per request, so only production output must be strict.
  if (process.env.NODE_ENV !== "production") return;

  const missing = requiredAtBuildTime.filter((name) => !process.env[name]);

  if (missing.length === 0) return;

  throw new Error(
    `Missing required build-time environment ${
      missing.length === 1 ? "variable" : "variables"
    }: ${missing.join(", ")}.\n` +
      "These are inlined into prerendered HTML, so they must be present when " +
      "`next build` runs — setting them as runtime-only variables ships a site " +
      "where no Clerk component ever renders.",
  );
}
