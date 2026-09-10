// Guards the localized store copy against the two ways it silently rots:
// a field that outgrew its store cap, and a translation left behind when the
// English changed. Run with `pnpm --filter @sendtally/mobile store:check`.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const locales = JSON.parse(fs.readFileSync(path.join(here, "locales.json"), "utf8"));
const listing = fs.readFileSync(path.join(here, "listing.md"), "utf8");

const CAPS = {
  title: 30,
  subtitle: 30,
  short: 80,
  keywords: 100,
  whatsnew: 500,
  description: 4000,
};

// Paragraph counts and bullet counts are the cheapest signal that a translation
// still matches the shape of the English it was written from.
function shape(text) {
  const paragraphs = text.split("\n\n").length;
  const bullets = (text.match(/^·/gm) ?? []).length;
  return { paragraphs, bullets };
}

function block(header) {
  const pattern = new RegExp(
    `${header.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?\\n\`\`\`\\n([\\s\\S]*?)\\n\`\`\``
  );
  const match = listing.match(pattern);
  if (match === null) throw new Error(`no block for ${header}`);
  return match[1];
}

const english = block("## Description, both stores");
const englishShape = shape(english);
const failures = [];

for (const [code, locale] of Object.entries(locales)) {
  for (const [field, cap] of Object.entries(CAPS)) {
    const length = locale[field].length;
    if (length > cap) failures.push(`${code} ${field}: ${length} chars, cap is ${cap}`);
  }

  // Apple pairs the app name, subtitle and keyword field, so a word repeated
  // between them is a wasted keyword rather than a stronger one.
  const named = new Set(
    `${locale.title} ${locale.subtitle}`.toLowerCase().match(/[\p{L}]+/gu) ?? []
  );
  for (const keyword of locale.keywords.split(",")) {
    if (named.has(keyword))
      failures.push(`${code} keyword "${keyword}" already in the name or subtitle`);
  }

  const local = shape(locale.description);
  if (local.paragraphs !== englishShape.paragraphs) {
    failures.push(
      `${code} description: ${local.paragraphs} paragraphs, English has ${englishShape.paragraphs}`
    );
  }
  if (local.bullets !== englishShape.bullets) {
    failures.push(
      `${code} description: ${local.bullets} bullets, English has ${englishShape.bullets}`
    );
  }
}

if (failures.length > 0) {
  console.error(`${failures.length} problem(s) in the localized store copy:`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log(
  `${Object.keys(locales).length} locales ok, all fields within cap and matching the English shape`
);
