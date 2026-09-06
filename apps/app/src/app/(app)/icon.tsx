import { ImageResponse } from "next/og";

import { LogoIcon } from "@/components/logo";
import { siteConfig } from "@/config/site";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: siteConfig.themeColor.dark,
        borderRadius: 7,
      }}
    >
      <LogoIcon height={22} style={{ color: "#fafafa" }} width={24} />
    </div>,
    { ...size },
  );
}
