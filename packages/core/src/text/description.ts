/** A piece of a line: plain text, or a pasted https address. */
export type DescriptionRun = { kind: "text"; text: string } | { kind: "link"; url: string };

/** A line of runs. */
export type DescriptionLine = DescriptionRun[];

/** A paragraph keeps the line breaks typed inside it; a list holds one line per item. */
export type DescriptionBlock =
  | { kind: "paragraph"; lines: DescriptionLine[] }
  | { kind: "bullets"; items: DescriptionLine[] }
  | { kind: "numbered"; items: DescriptionLine[] };

/** The longest description any item can have. */
export const MAX_DESCRIPTION = 2000;

const LINK = /https:\/\/[^\s<>()[\]]+/g;
const TRAILING = /[.,;:!?'"]+$/;
const BULLET = /^\s*- +(.*)$/;
const NUMBERED = /^\s*\d+\. +(.*)$/;

/** The runs of one line: a pasted https address becomes a link, the rest text. */
export function descriptionRuns(line: string): DescriptionLine {
  const runs: DescriptionLine = [];
  const text = (s: string): void => {
    if (s === "") return;
    const last = runs.at(-1);
    if (last?.kind === "text") last.text += s;
    else runs.push({ kind: "text", text: s });
  };
  let at = 0;
  for (const m of line.matchAll(LINK)) {
    text(line.slice(at, m.index));
    const [whole] = m;
    const url = whole.replace(TRAILING, "");
    runs.push({ kind: "link", url });
    text(whole.slice(url.length));
    at = m.index + whole.length;
  }
  text(line.slice(at));
  return runs;
}

/**
 * A description as typed, in blocks: a blank line ends a paragraph, a line starting `- ` is a
 * bullet and one starting `1. ` a numbered item. Nothing else is read as formatting.
 */
export function parseDescription(source: string): DescriptionBlock[] {
  const blocks: DescriptionBlock[] = [];
  let joins = false;
  for (const raw of source.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    if (line === "") {
      joins = false;
      continue;
    }
    const bullet = BULLET.exec(line);
    const numbered = bullet === null ? NUMBERED.exec(line) : null;
    const runs = descriptionRuns((bullet ?? numbered)?.[1] ?? line);
    const kind = bullet !== null ? "bullets" : numbered !== null ? "numbered" : "paragraph";
    const last = joins ? blocks.at(-1) : undefined;
    joins = true;
    if (last?.kind === "paragraph" && kind === "paragraph") last.lines.push(runs);
    else if (last !== undefined && last.kind !== "paragraph" && last.kind === kind) {
      last.items.push(runs);
    } else blocks.push(kind === "paragraph" ? { kind, lines: [runs] } : { kind, items: [runs] });
  }
  return blocks;
}

/** The longest a bare address shows before it is cut. */
const SHOWN_URL = 24;

/** What a link shows: its address without its scheme and www., cut to fit. */
export function linkText(url: string): string {
  const bare = url.replace(/^https:\/\/(www\.)?/, "");
  return bare.length > SHOWN_URL ? `${bare.slice(0, SHOWN_URL - 1)}…` : bare;
}

/** One text of a description as laid out: a paragraph, or a list item with its marker. */
export type DescriptionUnit =
  | { kind: "paragraph"; lines: DescriptionLine[] }
  | { kind: "bullet"; line: DescriptionLine }
  | { kind: "step"; n: number; line: DescriptionLine };

/** Every paragraph and list item in order, each list numbered from one. */
export const descriptionUnits = (blocks: readonly DescriptionBlock[]): DescriptionUnit[] =>
  blocks.flatMap((b): DescriptionUnit[] =>
    b.kind === "paragraph"
      ? [b]
      : b.items.map((line, i) =>
          b.kind === "bullets" ? { kind: "bullet", line } : { kind: "step", n: i + 1, line }
        )
  );

/** How many lines a folded description shows. */
export const FOLD_LINES = 5;

/**
 * Where a description folds, from the lines each unit takes: the units shown, and the lines
 * the last one keeps when it crosses the fold. None when it all fits.
 */
export function foldAt(
  lines: readonly number[],
  max = FOLD_LINES
): { units: number; lastLines: number | null } | null {
  let used = 0;
  for (const [i, n] of lines.entries()) {
    if (used + n > max) {
      const left = max - used;
      return left === 0 ? { units: i, lastLines: null } : { units: i + 1, lastLines: left };
    }
    used += n;
  }
  return null;
}
