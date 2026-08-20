type LexicalNode = {
  text?: unknown;
  children?: unknown;
};

/**
 * Flattens a Lexical rich text document into plain text.
 *
 * Used to derive meta descriptions from CMS content so every page ships a
 * description without editors having to maintain a second field.
 */
export function richTextToPlainText(content: { root?: { children?: unknown } }): string {
  const segments: string[] = [];

  function walk(nodes: unknown): void {
    if (!Array.isArray(nodes)) {
      return;
    }

    for (const node of nodes as LexicalNode[]) {
      if (typeof node?.text === "string") {
        segments.push(node.text);
      }

      walk(node?.children);
    }
  }

  walk(content?.root?.children);

  return segments.join(" ").replace(/\s+/g, " ").trim();
}
