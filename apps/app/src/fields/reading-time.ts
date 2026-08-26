import type { NumberField } from "payload";

import { richTextToPlainText } from "@/lib/rich-text";

const WORDS_PER_MINUTE = 200;

/**
 * Virtual sidebar field with the estimated reading time of the document's
 * `content`, shared by every collection that renders a long-form article.
 */
export function readingTimeField(): NumberField {
  return {
    name: "readingTime",
    type: "number",
    virtual: true,
    admin: {
      position: "sidebar",
      description: "Estimated reading time in minutes, computed from the content.",
      readOnly: true,
    },
    hooks: {
      afterRead: [
        ({ siblingData }) => {
          const content = siblingData?.content as { root?: { children?: unknown } } | undefined;
          if (!content) return 0;
          const words = richTextToPlainText(content).split(/\s+/).filter(Boolean).length;
          return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
        },
      ],
    },
  };
}
