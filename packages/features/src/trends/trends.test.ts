import { describe, expect, it } from "vitest";
import type { Gym, SessionClimb, SessionTag, SessionWithClimbs } from "@sendtally/api-client";
import { bucketsFor } from "./buckets";
import { daysVM } from "./days";
import { enduranceVM } from "./endurance";
import { gradeTap, isRefined, resetFilter, withPlace, withScope } from "./filter";
import { trendsVM } from "./overview";
import { DEFAULT_TREND_FILTER, type TrendFilter, type TrendTileVM, type TrendsVM } from "./types";

const NOW = new Date("2026-08-06T12:00:00.000Z");

function tag(name: string): SessionTag {
  return { id: `id-${name}`, name, slug: name.toLowerCase() };
}

type ClimbSpec = Partial<SessionClimb> & { vGrade: number };

let seq = 0;

function session(
  startIso: string,
  climbs: ClimbSpec[],
  extra: Partial<SessionWithClimbs> = {}
): SessionWithClimbs {
  seq += 1;
  return {
    fingerprint: `fp-${seq}`,
    board: null,
    source: "manual",
    location: "indoor",
    gym_id: null,
    area_id: null,
    name: null,
    start_at: startIso,
    end_at: new Date(Date.parse(startIso) + 2 * 3_600_000).toISOString(),
    times: "both",
    climb_count: climbs.length,
    top_grade: 0,
    top_send_grade: 0,
    top_grade_label: null,
    top_send_grade_label: null,
    notes: null,
    rpe: 6,
    title: "",
    strava_activity_id: null,
    posted_at: null,
    post_state: null,
    post_error: null,
    tags: [],
    climbs: climbs.map((c, i) => ({
      time: startIso,
      name: `c${seq}-${i}`,
      kind: "send",
      tries: 2,
      style: "redpoint",
      angle: null,
      note: null,
      link: null,
      ...c,
    })),
    ...extra,
  };
}

const filter = (f: Partial<TrendFilter> = {}): TrendFilter => ({ ...DEFAULT_TREND_FILTER, ...f });

function tileOf(vm: TrendsVM, id: TrendTileVM["id"]): TrendTileVM {
  const found = vm.groups.flatMap((g) => g.tiles).find((t) => t.id === id);
  if (found === undefined) throw new Error(`no ${id} tile`);
  return found;
}

const yds = (value: string): SessionClimb["grade"] => ({ scale: "yds", value });

describe("trendsVM", () => {
  const rows = [
    session("2026-08-01T18:00:00.000Z", [
      { vGrade: 4, style: "flash", tries: 1 },
      { vGrade: 6 },
      { vGrade: 7, kind: "attempt", style: undefined },
    ]),
    session("2026-07-20T18:00:00.000Z", [{ vGrade: 5 }, { vGrade: 3, style: "flash", tries: 1 }], {
      location: "outdoor",
      tags: [tag("Bishop")],
      rpe: 8,
    }),
    session("2026-07-21T18:00:00.000Z", [{ vGrade: 10, grade: yds("5.11a") }]),
  ];

  it("reads the discipline with the most sends when none is picked", () => {
    const vm = trendsVM(rows, [], filter({ range: "1m" }), NOW);
    expect(vm.scope).toBe("boulder");
    expect(tileOf(vm, "hardest").total).toBe(6);
    expect(tileOf(vm, "volume").total).toBe(5);
    expect(tileOf(vm, "flash").total).toBe(50);
    expect(tileOf(vm, "tries").total).toBe(1.5);
  });

  it("groups the tiles and hides a section with nothing in it", () => {
    const vm = trendsVM(rows, [], filter({ range: "1m" }), NOW);
    expect(vm.groups.map((g) => g.id)).toEqual(["grade", "volume", "technique"]);
    expect(vm.groups[1]!.tiles.map((t) => t.id)).toEqual(["days", "volume", "effort"]);
  });

  it("narrows climbs to a grade range and says so in the captions", () => {
    const vm = trendsVM(
      rows,
      [],
      filter({ range: "1m", scope: "boulder", grade: { lo: 5, hi: 7 } }),
      NOW
    );
    expect(tileOf(vm, "volume").total).toBe(3);
    expect(tileOf(vm, "hardest").caption).toContain("V5-V7");
  });

  it("offers the range's climbs per grade for the picker, whatever grade is set", () => {
    const vm = trendsVM(rows, [], filter({ range: "1m", grade: { lo: 6, hi: 6 } }), NOW);
    expect(vm.grades.map((b) => [b.label, b.count])).toEqual([
      ["V3", 1],
      ["V4", 1],
      ["V5", 1],
      ["V6", 1],
      ["V7", 1],
    ]);
    expect(vm.presets.map((p) => p.grade)).toEqual([null, { lo: 5, hi: 7 }, { lo: 3, hi: 4 }]);
  });

  it("filters to outside sessions and to tags", () => {
    const outside = trendsVM(rows, [], filter({ range: "1m", setting: "outdoor" }), NOW);
    expect(tileOf(outside, "volume").total).toBe(2);
    const tagged = trendsVM(rows, [], filter({ range: "1m", tags: ["bishop"] }), NOW);
    expect(tileOf(tagged, "days").total).toBe(1);
    expect(tileOf(tagged, "effort").total).toBe(8);
  });

  it("splits days inside and outside", () => {
    const vm = trendsVM(rows, [], filter({ range: "1m" }), NOW);
    expect(tileOf(vm, "days").sub).toBe("1 inside · 1 outside");
  });

  it("drops grade tiles and shows lifetime numbers in All", () => {
    const vm = trendsVM(rows, [], filter({ range: "1m", scope: "all" }), NOW);
    expect(vm.groups.map((g) => g.id)).toEqual(["volume", "technique"]);
    expect(tileOf(vm, "volume").sub).toBe("5 boulders · 1 route");
    expect(tileOf(vm, "hours").total).toBe(6);
    expect(vm.stats?.find((s) => s.key === "hardestRoute")?.value).toBe("5.11a");
    expect(vm.stats?.find((s) => s.key === "flashed")).toMatchObject({
      value: "2",
      lifetime: "Lifetime 2",
    });
  });

  it("ignores a grade filter in All, where grades never convert", () => {
    const vm = trendsVM(
      rows,
      [],
      filter({ range: "1m", scope: "all", grade: { lo: 9, hi: 9 } }),
      NOW
    );
    expect(tileOf(vm, "volume").total).toBe(6);
    expect(vm.gradeLabel).toBeNull();
  });

  it("compares against the period just before", () => {
    const withPrior = [...rows, session("2026-06-20T18:00:00.000Z", [{ vGrade: 4 }])];
    const vm = trendsVM(withPrior, [], filter({ range: "1m", scope: "boulder" }), NOW);
    expect(tileOf(vm, "hardest").delta).toBe("▲ 2 grades vs prior period");
    expect(tileOf(vm, "volume").delta).toBe("▲ 400% vs prior period");
  });

  it("falls back to a first encounter for sends logged before styles existed", () => {
    const legacy = [
      session("2026-08-01T18:00:00.000Z", [
        { vGrade: 4, tries: 1, style: undefined, name: "Arete" },
      ]),
      session("2026-08-02T18:00:00.000Z", [
        { vGrade: 4, tries: 1, style: undefined, name: "Arete" },
      ]),
    ];
    const vm = trendsVM(legacy, [], filter({ range: "1m" }), NOW);
    expect(tileOf(vm, "flash").total).toBe(50);
  });

  it("reads a gym's circuits on their own ladder", () => {
    const purple = { id: "p", label: "Purple", colour: "purple" as const };
    const red = { id: "r", label: "Red", colour: "red" as const };
    const gym: Gym = {
      id: "g1",
      name: "Crux Lab",
      scale: "v",
      walls: [],
      circuits: [
        { id: "r", colour: "red", label: "", low: 4, high: 5 },
        { id: "p", colour: "purple", label: "", low: 6, high: 7 },
      ],
    };
    const gymRows = [
      session(
        "2026-08-01T10:00:00.000Z",
        [{ vGrade: 6, circuit: purple }, { vGrade: 4, circuit: red }, { vGrade: 9 }],
        {
          gym_id: "g1",
        }
      ),
    ];
    const vm = trendsVM(gymRows, [gym], withScope(filter({ range: "1m" }), "circuit", "g1"), NOW);
    expect(vm.scope).toBe("circuit");
    expect(tileOf(vm, "hardest").format(1)).toBe("Purple");
    expect(tileOf(vm, "pyramid").points.map((p) => p.axis)).toEqual(["Red", "Purple"]);
    expect(tileOf(vm, "volume").total).toBe(2);
    expect(vm.scaleGyms[0]?.ladder.map((c) => c.colour)).toEqual(["red", "purple"]);
  });
});

describe("filter helpers", () => {
  it("builds a range from two taps", () => {
    const first = gradeTap(null, 6);
    expect(first).toEqual({ grade: { lo: 6, hi: 6 }, anchor: 6 });
    expect(gradeTap(first.anchor, 3)).toEqual({ grade: { lo: 3, hi: 6 }, anchor: null });
  });

  it("clears the grade and the gym when the scope changes", () => {
    const f = withScope(filter({ grade: { lo: 3, hi: 4 } }), "circuit", "g1");
    expect(f).toMatchObject({ scope: "circuit", gymId: "g1", setting: "indoor", grade: null });
    expect(withScope(f, "route")).toMatchObject({ scope: "route", gymId: null, setting: "all" });
    expect(withPlace(f, "outdoor", null)).toMatchObject({
      scope: "boulder",
      setting: "outdoor",
      gymId: null,
    });
  });

  it("knows when anything is refined and resets it all but the scope", () => {
    const f = filter({ scope: "route", grade: { lo: 1, hi: 2 }, tags: ["x"] });
    expect(isRefined(f)).toBe(true);
    expect(resetFilter(f)).toEqual(filter({ scope: "route" }));
    expect(isRefined(resetFilter(f))).toBe(false);
  });
});

describe("enduranceVM", () => {
  const circuit = (laps: number[], name = "Blue ARC"): ClimbSpec => ({
    vGrade: 3,
    name,
    style: "redpoint",
    tries: 1,
    endurance: { unit: "moves", target: 40, laps },
  });

  it("draws the pump curve and reads where it fades", () => {
    const rows = [
      session("2026-07-01T18:00:00.000Z", [circuit([40, 40, 30])]),
      session("2026-07-10T18:00:00.000Z", [circuit([40, 40, 20, 10])]),
    ];
    const vm = enduranceVM(rows, "3m", NOW);
    const curve = vm.tiles.find((t) => t.id === "pumpCurve")!;
    expect(curve.points.map((p) => p.a)).toEqual([100, 100, 62.5, 25]);
    expect(vm.insight).toBe("You hold 95%+ for 2 laps, then fade to 25% by lap 4.");
    expect(vm.stats.find((s) => s.key === "moves")?.value).toBe("220");
    expect(vm.circuits).toEqual([
      expect.objectContaining({
        label: "Blue ARC",
        sets: 2,
        laps: 7,
        rate: "57%",
        best: "2 in a row",
        trend: "▼ 17 pts",
      }),
    ]);
  });
});

describe("daysVM", () => {
  it("colours the calendar and counts weekly streaks", () => {
    const rows = [
      session("2026-08-05T18:00:00.000Z", [{ vGrade: 3 }]),
      session("2026-07-29T18:00:00.000Z", [{ vGrade: 3 }], {
        location: "outdoor",
        tags: [tag("Bishop")],
      }),
      session("2026-07-01T18:00:00.000Z", [{ vGrade: 3 }], { tags: [tag("Bishop")] }),
    ];
    const vm = daysVM(rows, [], NOW);
    const cells = vm.weeks.flat();
    expect(cells.filter((c) => c.state === "indoor")).toHaveLength(2);
    expect(cells.find((c) => c.state === "outdoor")?.detail).toBe(
      "Outside, Bishop · 1 climb · RPE 6"
    );
    expect(vm.stats.find((s) => s.key === "current")?.value).toBe("2 weeks");
    expect(vm.stats.find((s) => s.key === "break")?.value).toBe("27 days");
    expect(vm.tags).toEqual([
      expect.objectContaining({ name: "Bishop", inside: 1, outside: 1, total: 2 }),
    ]);
    expect(vm.weeks.every((w) => w.length === 7)).toBe(true);
  });
});

describe("bucketsFor", () => {
  it("names each month for the readout", () => {
    const buckets = bucketsFor("6m", NOW, null);
    expect(buckets).toHaveLength(6);
    expect(buckets[5]).toMatchObject({ axis: "Aug", label: "August 2026" });
  });
});
