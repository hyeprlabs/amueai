import { Logo, LogoIcon } from "@/components/logo";

/** Replaces Payload's default wordmark on the /admin login screen. */
export const AdminLogo = () => (
  <Logo style={{ color: "var(--theme-elevation-1000)", height: 38, width: "auto" }} />
);

/** Replaces Payload's default icon in the collapsed admin nav rail. */
export const AdminIcon = () => (
  <LogoIcon style={{ color: "var(--theme-elevation-1000)", height: 24, width: "auto" }} />
);
