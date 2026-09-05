import type { CollectionConfig } from "payload";

import { isLoggedIn } from "@/access/is-logged-in";

export const Media: CollectionConfig = {
  slug: "media",
  access: {
    read: () => true,
    create: isLoggedIn,
    update: isLoggedIn,
    delete: isLoggedIn,
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
    },
  ],
  upload: {
    imageSizes: [
      { name: "thumbnail", width: 400, height: 300, position: "centre" },
      { name: "card", width: 768, height: 432, position: "centre" },
      { name: "og", width: 1200, height: 630, position: "centre" },
    ],
    focalPoint: true,
    formatOptions: { format: "webp", options: { quality: 80 } },
    // `pasteURL` is enabled by default (no `allowList` restricts it to
    // specific hosts), so a document can be created by passing a `url`
    // instead of binary file data. The MCP-backed post-writing workflow
    // uses this to link an image it found on the web without a separate
    // upload step.
  },
};
