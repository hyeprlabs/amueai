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
    // Lets a document be created by passing a `url` instead of binary file
    // data, so the MCP-backed post-writing workflow can link an image it
    // found on the web without a separate upload step.
    pasteURL: true,
  },
};
