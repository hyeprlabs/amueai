import { ImageResponse } from "next/og";

import { LogoIcon } from "@/components/logo";
import { siteConfig } from "@/config/site";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: siteConfig.themeColor.dark,
        borderRadius: 40,
      }}
    >
      <LogoIcon height={124} style={{ color: "#fafafa" }} width={136} />
    </div>,
    { ...size },
  );
}
