import fs from "node:fs";
const dir = process.argv[2];
fs.mkdirSync(dir, { recursive: true });
const root = process.cwd();
const en = {};
for (const f of fs.readdirSync(`${root}/packages/features/src/i18n/locales/en`)) {
  const src = fs.readFileSync(`${root}/packages/features/src/i18n/locales/en/${f}`, "utf8");
  for (const m of src.matchAll(/"([\w.]+)":\s*\n?\s*"((?:[^"\\]|\\.)*)"/g))
    en[m[1]] = JSON.parse(`"${m[2]}"`);
}
const ex = fs.readFileSync(`${root}/packages/features/src/exercises/builtIns.ts`, "utf8");
const out = [];
for (const m of ex.matchAll(/spec\("(\w+)", "(\w+)", "([\w.]+)"(?:, \{ sets: (\d+) \})?\)/g)) {
  const id = m[3].split(".").pop();
  out.push({
    type: "exercise",
    id,
    key: m[3],
    name: en[m[3]],
    kind: m[1],
    measure: m[2],
    startSets: m[4] ? +m[4] : null,
    note: "",
    status: "built",
  });
}
const wo = fs.readFileSync(`${root}/packages/features/src/workouts/builtIns.ts`, "utf8");
const body = wo.slice(wo.indexOf("const BUILT_INS"));
for (const block of body.split(/\n  \{\n/).slice(1)) {
  const g = (k) => block.match(new RegExp(`${k}: ([^,\\n]+),`))?.[1];
  const str = (v) => (v === "null" ? null : v.replace(/"/g, ""));
  const num = (v) => (v === "null" ? null : +v);
  const items = [];
  for (const it of block.matchAll(
    /(hang|lift)\(\s*"([\w.]+)",\s*([\s\S]*?)\)(?=,?\s*\n?\s*(?:hang|lift|\]))/g
  )) {
    const ref =
      it[1] === "hang"
        ? `grip:${it[2]}`
        : it[2].startsWith("workouts.step.") && ["hard", "easy"].includes(it[2].split(".").pop())
          ? `step:${it[2].split(".").pop()}`
          : it[2].split(".").pop();
    const doses = [...it[3].matchAll(/\{([^}]*)\}/g)].map((d) =>
      Object.fromEntries(
        d[1]
          .split(",")
          .map((p) => p.split(":").map((s) => s.trim()))
          .filter((p) => p[0])
          .map(([k, v]) => [k, +v])
      )
    );
    items.push({ ref, doses });
  }
  const nameKey = str(g("name")),
    blurbKey = str(g("description"));
  out.push({
    type: "workout",
    id: str(g("id")),
    nameKey,
    blurbKey,
    name: en[nameKey],
    blurb: en[blurbKey],
    kind: str(g("kind")),
    focus: str(g("focus")),
    minutes: num(g("minutes")),
    targetRpe: num(g("targetRpe")),
    items,
    note: "",
    status: "built",
  });
}
for (const e of out)
  fs.writeFileSync(
    `${dir}/${e.type === "exercise" ? "ex-" : "wo-"}${e.id}.json`,
    JSON.stringify(e)
  );
console.log(
  out.length,
  out.filter((e) => !e.name || (e.type === "workout" && !e.blurb)).map((e) => e.id)
);
console.log(
  JSON.stringify(
    out
      .filter((e) => e.type === "workout")
      .map((w) => [w.id, w.items.map((i) => i.ref + JSON.stringify(i.doses))])
  )
);
