import { readFileSync, writeFileSync } from "node:fs";
import ts from "typescript";

const KEEP_PREFIXES = [
  "oxlint-disable",
  "eslint-disable",
  "@ts-expect-error",
  "@ts-ignore",
  "tslint:disable",
];

function shouldKeep(text) {
  const body = text.replace(/^\/\/\s*|^\/\*\s*|\s*\*\/$/g, "").trim();
  return KEEP_PREFIXES.some((prefix) => body.startsWith(prefix));
}

function collectRanges(sourceFile, text) {
  const ranges = [];
  const seen = new Set();

  function addAt(pos) {
    for (const kind of [ts.getLeadingCommentRanges, ts.getTrailingCommentRanges]) {
      for (const range of kind(text, pos) ?? []) {
        const key = `${range.pos}-${range.end}`;
        if (seen.has(key)) continue;
        seen.add(key);
        if (!shouldKeep(text.slice(range.pos, range.end))) ranges.push(range);
      }
    }
  }

  function visit(node) {
    addAt(node.getFullStart());
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  addAt(sourceFile.endOfFileToken.getFullStart());

  return ranges.sort((a, b) => a.pos - b.pos);
}

function stripFile(filePath) {
  const text = readFileSync(filePath, "utf8");
  const scriptKind = filePath.endsWith(".tsx")
    ? ts.ScriptKind.TSX
    : filePath.endsWith(".jsx")
      ? ts.ScriptKind.JSX
      : filePath.endsWith(".js") || filePath.endsWith(".mjs")
        ? ts.ScriptKind.JS
        : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true, scriptKind);
  const ranges = collectRanges(sourceFile, text);
  if (ranges.length === 0) return false;

  let result = text;
  for (const range of ranges.reverse()) {
    let start = range.pos;
    let end = range.end;

    const lineStart = result.lastIndexOf("\n", start - 1) + 1;
    const beforeOnLine = result.slice(lineStart, start);
    const isOwnLine = beforeOnLine.trim() === "";

    if (isOwnLine) {
      start = lineStart;
      while (end < result.length && (result[end] === " " || result[end] === "\t")) end++;
      if (result[end] === "\n") end++;
    } else {
      while (start > 0 && (result[start - 1] === " " || result[start - 1] === "\t")) start--;
    }

    result = result.slice(0, start) + result.slice(end);
  }

  result = result.replace(/\n{3,}/g, "\n\n");
  writeFileSync(filePath, result);
  return true;
}

const files = process.argv.slice(2);
let changed = 0;
for (const file of files) {
  if (stripFile(file)) changed++;
}
console.log(`stripped comments from ${changed}/${files.length} files`);
