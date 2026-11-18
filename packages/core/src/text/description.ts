/** A piece of a line: plain text, or a pasted https address. */
export type DescriptionRun = { kind: "text"; text: string } | { kind: "link"; url: string };

/** A line of runs. */
export type DescriptionLine = DescriptionRun[];

/** The longest description any item can have. */
export const MAX_DESCRIPTION = 2000;

const LINK = /https:\/\/(?:[^\s<>()[\]]|\([^\s<>()[\]]*\))+/g;
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

/**
 * A description as typed, as the texts it lays out in order: a blank line ends a paragraph, a
 * line starting `- ` is a bullet and one starting `1. ` a step, numbered from one in each run of
 * steps. Nothing else is read as formatting.
 */
export function descriptionUnits(source: string): DescriptionUnit[] {
  const units: DescriptionUnit[] = [];
  let joins = false;
  let step = 0;
  for (const raw of source.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    const bullet = BULLET.exec(line);
    const numbered = bullet === null ? NUMBERED.exec(line) : null;
    step = numbered === null ? 0 : step + 1;
    const joined = joins;
    joins = line !== "";
    const last = units.at(-1);
    if (line === "") continue;
    if (bullet !== null) units.push({ kind: "bullet", line: descriptionRuns(bullet[1] ?? "") });
    else if (numbered !== null)
      units.push({ kind: "step", n: step, line: descriptionRuns(numbered[1] ?? "") });
    else if (joined && last?.kind === "paragraph") last.lines.push(descriptionRuns(line));
    else units.push({ kind: "paragraph", lines: [descriptionRuns(line)] });
  }
  return units;
}

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
