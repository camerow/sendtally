// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const here = fileURLToPath(new URL(".", import.meta.url));
const COPY_ATTRIBUTES = new Set(["alt", "aria-label", "title", "placeholder"]);

const files = [
  ...readdirSync(`${here}components`)
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => `${here}components/${f}`),
  `${here}../routes/home.tsx`,
  `${here}../routes/pricing.tsx`,
  `${here}../routes/agents.tsx`,
];

function literalText(node: ts.JsxAttribute["initializer"]): string | null {
  if (node === undefined) return null;
  if (ts.isStringLiteral(node)) return node.text;
  if (ts.isJsxExpression(node) && node.expression !== undefined) {
    const e = node.expression;
    if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) return e.text;
  }
  return null;
}

/** Visitor-facing words written straight into a component instead of read from copy.ts. */
function strayCopy(text: string): string[] {
  const source = ts.createSourceFile(
    "component.tsx",
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const found: string[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isJsxText(node) && /\p{L}/u.test(node.text)) found.push(node.text.trim());
    if (ts.isJsxAttribute(node) && COPY_ATTRIBUTES.has(node.name.getText(source))) {
      const text = literalText(node.initializer);
      if (text !== null && /\p{L}/u.test(text))
        found.push(`${node.name.getText(source)}="${text}"`);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

describe("landing copy lives in copy.ts", () => {
  it.each(files.map((f) => [f.slice(f.lastIndexOf("/") + 1), f]))(
    "%s holds no visitor-facing text of its own",
    (_name, path) => {
      expect(strayCopy(readFileSync(path, "utf8"))).toEqual([]);
    }
  );

  it("catches text nodes and literal copy attributes", () => {
    expect(
      strayCopy(
        '<a href="/x" alt="A climber" aria-label={"Close"} title={copy.t}>Sign in · {n}</a>'
      )
    ).toEqual(['alt="A climber"', 'aria-label="Close"', "Sign in ·"]);
  });
});
