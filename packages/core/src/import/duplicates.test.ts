import { describe, expect, it } from "vitest";
import type { Grade } from "../grades";
import { importFingerprint, likelyDuplicates, type LoggedSession } from "./duplicates";
import type { ImportSession } from "./types";

// FNV-1a stands in for SHA-256: the tests need a stable hash, not a secure one.
const fakeSha = async (text: string): Promise<string> => {
  let h = 0x811c9dc5;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 0x01000193) >>> 0;
  return h.toString(16).padStart(32, "0");
};

const v = (value: number): Grade => ({ scale: "v", value });

const planned = (date: string, climbs: [string, Grade][], name?: string): ImportSession => ({
  date,
  ...(name === undefined ? {} : { name }),
  location: "indoor",
  climbs: climbs.map(([n, grade]) => ({ name: n, grade, kind: "send", tries: 1 })),
  rows: [],
});

const logged = (
  date: string,
  climbs: [string, Grade][],
  fingerprint = "manual-1"
): LoggedSession => ({
  fingerprint,
  title: "Tuesday night session",
  start_at: `${date}T18:00:00.000Z`,
  climbs: climbs.map(([name, grade]) => ({ name, grade, vGrade: 0 })),
});

const day = "2026-03-10";

describe("likelyDuplicates", () => {
  const cases: { name: string; plan: ImportSession; log: LoggedSession; flagged: boolean }[] = [
    {
      name: "same date, same climbs from another source",
      plan: planned(day, [
        ["Crimpy", v(4)],
        ["Slab", v(3)],
        ["Roof", v(5)],
      ]),
      log: logged(day, [
        ["crimpy ", v(4)],
        ["Slab", v(3)],
        ["Roof", v(5)],
        ["Warm up", v(1)],
      ]),
      flagged: true,
    },
    {
      name: "same date, different climbs: two sessions in one day",
      plan: planned(day, [
        ["", v(6)],
        ["", v(7)],
        ["", v(2)],
      ]),
      log: logged(day, [
        ["", v(4)],
        ["", v(5)],
        ["", v(2)],
      ]),
      flagged: false,
    },
    {
      name: "one side named and the other not: decided on grades",
      plan: planned(day, [
        ["Crimpy", v(4)],
        ["Slab", v(3)],
      ]),
      log: logged(day, [
        ["", v(4)],
        ["", v(3)],
      ]),
      flagged: true,
    },
    {
      name: "both named, grades match, names differ",
      plan: planned(day, [
        ["Crimpy", v(4)],
        ["Slab", v(3)],
      ]),
      log: logged(day, [
        ["Arete", v(4)],
        ["Pinch", v(3)],
      ]),
      flagged: false,
    },
    {
      name: "same climbs on another date",
      plan: planned(day, [
        ["", v(4)],
        ["", v(3)],
      ]),
      log: logged("2026-03-11", [
        ["", v(4)],
        ["", v(3)],
      ]),
      flagged: false,
    },
    {
      name: "each logged climb matches once",
      plan: planned(day, [
        ["", v(4)],
        ["", v(4)],
        ["", v(4)],
      ]),
      log: logged(day, [["", v(4)]]),
      flagged: false,
    },
    {
      name: "exactly half is not most",
      plan: planned(day, [
        ["", v(4)],
        ["", v(5)],
      ]),
      log: logged(day, [["", v(4)]]),
      flagged: false,
    },
    {
      name: "an unnamed climb never takes the logged climb a named one needs",
      plan: planned(day, [
        ["", v(4)],
        ["Arete", v(4)],
      ]),
      log: logged(day, [
        ["Arete", v(4)],
        ["Crimp", v(4)],
      ]),
      flagged: true,
    },
    {
      name: "same value in another scale",
      plan: planned(day, [["", { scale: "yds", value: "5.10a" }]]),
      log: logged(day, [["", { scale: "french", value: "6a" }]]),
      flagged: false,
    },
  ];

  it.each(cases)("$name", async ({ plan, log, flagged }) => {
    const result = await likelyDuplicates([plan], [log], fakeSha);
    expect(result).toEqual(flagged ? [{ index: 0, logged: log }] : []);
  });

  it("reads a legacy climb's grade from vGrade", async () => {
    const log = { ...logged(day, []), climbs: [{ name: "", vGrade: 4 }] };
    const result = await likelyDuplicates([planned(day, [["", v(4)]])], [log], fakeSha);
    expect(result).toEqual([{ index: 0, logged: log }]);
  });

  it("leaves out a session its fingerprint already skips", async () => {
    const plan = planned(day, [["Crimpy", v(4)]], "Gym");
    const log = logged(day, [["Crimpy", v(4)]], await importFingerprint(plan, fakeSha));
    expect(await likelyDuplicates([plan], [log], fakeSha)).toEqual([]);
  });

  it("returns the index of each flagged session with the session it matched", async () => {
    const plans = [planned("2026-03-09", [["", v(2)]]), planned(day, [["", v(4)]])];
    const log = logged(day, [["", v(4)]]);
    expect(await likelyDuplicates(plans, [log], fakeSha)).toEqual([{ index: 1, logged: log }]);
  });
});
