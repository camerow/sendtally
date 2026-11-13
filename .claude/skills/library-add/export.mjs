import fs from "node:fs";
import {
  BUILT_IN_EXERCISES,
  BUILT_IN_WORKOUTS,
} from "../../../packages/core/src/hang/builtIns.ts";
const dir = process.argv[2];
fs.mkdirSync(dir, { recursive: true });
const root = process.cwd();
const en = {};
for (const f of fs.readdirSync(`${root}/packages/features/src/i18n/locales/en`)) {
  const src = fs.readFileSync(`${root}/packages/features/src/i18n/locales/en/${f}`, "utf8");
  for (const m of src.matchAll(/"([\w.]+)":\s*\n?\s*"((?:[^"\\]|\\.)*)"/g))
    en[m[1]] = JSON.parse(`"${m[2]}"`);
}
const keys = fs.readFileSync(`${root}/packages/features/src/i18n/builtIns.ts`, "utf8");
const stem = (id) => keys.match(new RegExp(`"?${id}"?: "([\\w.]+)",`))?.[1];
const out = [];
for (const e of BUILT_IN_EXERCISES)
  out.push({
    type: "exercise",
    id: e.id,
    key: `workouts.exercise.${e.id}`,
    name: e.name,
    kind: e.kind,
    measure: e.measure,
    startSets: e.dose?.sets ?? null,
    note: "",
    status: "built",
  });
for (const w of BUILT_IN_WORKOUTS)
  out.push({
    type: "workout",
    id: w.id,
    nameKey: `${stem(w.id)}.name`,
    blurbKey: `${stem(w.id)}.blurb`,
    name: w.name,
    blurb: en[`${stem(w.id)}.blurb`],
    kind: w.kind,
    focus: w.focus,
    minutes: w.minutes,
    targetRpe: w.targetRpe,
    items: w.items.map((i) => ({
      ref: "grip" in i ? `grip:${i.grip}` : "step" in i ? `step:${i.step}` : i.exercise,
      doses: i.doses,
    })),
    note: "",
    status: "built",
  });
for (const e of out)
  fs.writeFileSync(
    `${dir}/${e.type === "exercise" ? "ex-" : "wo-"}${e.id}.json`,
    JSON.stringify(e)
  );
console.log(
  out.length,
  out.filter((e) => e.type === "workout" && !e.blurb).map((e) => e.id)
);
