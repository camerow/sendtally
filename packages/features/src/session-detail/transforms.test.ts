import { describe, expect, it } from "vitest";
import type { SessionDetail } from "@sendtally/api-client";
import { climbMetaLabel, climbVMs, filterAndSortClimbs, sessionDetailVM } from "./transforms";
import { DEFAULT_GRADE_SCALES as SCALES } from "../settings/transforms";

const detail: SessionDetail = {
  fingerprint: "42-1",
  board: "tension",
  source: "board",
  location: null,
  gym_id: null,
  area_id: null,
  area: null,
  areas: [],
  name: null,
  start_at: "2026-07-01T17:50:00.000Z",
  end_at: "2026-07-01T19:25:00.000Z",
  times: "both",
  climb_count: 4,
  send_count: 0,
  top_grade: 7,
  top_send_grade: 7,
  top_grade_label: null,
  top_send_grade_label: null,
  notes: null,
  entries: [],
  rpe: 7,
  rpe_source: "computed",
  title: "Solid climbing session · 4 climbs, top V7",
  strava_activity_id: 555,
  posted_at: "2026-07-02T00:00:00.000Z",
  post_state: "posted",
  post_error: null,
  membership_id: null,
  week: null,
  focus: null,
  tags: [],
  climbs: [
    {
      time: "2026-07-01T18:00:00.000Z",
      name: "Jug Life",
      vGrade: 4,
      kind: "send",
      tries: 1,
      angle: 40,
      note: null,
      area: null,
      link: null,
    },
    {
      time: "2026-07-01T18:20:00.000Z",
      name: "Crimp Reaper",
      vGrade: 7,
      kind: "send",
      tries: 3,
      angle: 40,
      note: null,
      area: null,
      link: null,
    },
    {
      time: "2026-07-01T18:50:00.000Z",
      name: "Mind Meld",
      vGrade: 8,
      kind: "attempt",
      tries: 4,
      angle: 45,
      note: null,
      area: null,
      link: null,
    },
    {
      time: "2026-07-01T19:20:00.000Z",
      name: "",
      vGrade: -1,
      kind: "send",
      tries: 1,
      angle: null,
      note: null,
      area: null,
      link: null,
    },
  ],
};

describe("climbVMs", () => {
  it("derives result and top-send flags in climb order", () => {
    const vms = climbVMs(detail.climbs, SCALES);
    expect(vms.map((c) => c.result)).toEqual(["flash", "sent", "project", "flash"]);
    expect(vms[1]?.isTopSend).toBe(true);
    expect(vms[2]?.isTopSend).toBe(false);
    expect(vms[3]?.name).toBe("Unknown climb");
    expect(vms[3]?.gradeLabel).toBe("V?");
    expect(vms[2]?.angleLabel).toBe("45°");
    expect(vms[3]?.angleLabel).toBeNull();
  });

  it("leaves the angle out of a climb's meta when there is none", () => {
    expect(climbMetaLabel({ angleLabel: "40°", attempts: 7 })).toBe("40° · 7 attempts");
    expect(climbMetaLabel({ angleLabel: null, attempts: 1 })).toBe("1 attempt");
  });

  it("carries the Areas link of a linked climb, and each climb's area", () => {
    const link = { id: "c1", name: "Crimp Reaper", slug: "crimp-reaper" };
    const area = { id: "a1", name: "Buttermilks", slug: "buttermilks" };
    const climbs = detail.climbs.map((c, i) => (i === 1 ? { ...c, link, area } : c));
    expect(climbVMs(climbs, SCALES).map((c) => c.climbSlug)).toEqual([
      null,
      "crimp-reaper",
      null,
      null,
    ]);
    expect(climbVMs(climbs, SCALES).map((c) => c.area)).toEqual([null, "Buttermilks", null, null]);
  });

  it("calls an unsent climb a project only when it is one, and counts its tries otherwise", () => {
    const vms = climbVMs(detail.climbs, SCALES, new Set(), new Set(["mind meld"]));
    expect(vms.map((c) => [c.pill, c.resultLabel])).toEqual([
      ["flash", "Flash"],
      ["sent", "Sent"],
      ["project", "Project"],
      ["flash", "Flash"],
    ]);
    const tried = climbVMs(detail.climbs, SCALES);
    expect([tried[2]?.pill, tried[2]?.resultLabel]).toEqual(["tries", "4 tries"]);
  });

  it("reads the Top tile as a plain dash when nothing was sent", () => {
    const unsent = {
      ...detail,
      climbs: detail.climbs.map((c) => ({ ...c, kind: "attempt" as const })),
    };
    const top = sessionDetailVM(unsent, SCALES).stats.find((s) => s.label === "Top");
    expect(top).toEqual({ label: "Top", value: "-", accent: false });
  });

  it("lists every area, and names a climb's area on a two-area day or indoors", () => {
    const at = (id: string, name: string) => ({ id, name, slug: id });
    const two = [at("a1", "Stanage Popular"), at("a2", "Stanage Plantation")];
    const outdoor = { ...detail, location: "outdoor" as const };
    expect(sessionDetailVM({ ...outdoor, areas: two }, SCALES).areas).toEqual(two);
    expect(sessionDetailVM({ ...outdoor, areas: two }, SCALES).climbAreas).toBe(true);
    expect(sessionDetailVM({ ...outdoor, areas: [two[0]!] }, SCALES).climbAreas).toBe(false);
    expect(sessionDetailVM({ ...detail, location: "indoor", areas: [] }, SCALES).climbAreas).toBe(
      true
    );
  });

  it("reads a one-try send of an earlier project as a send, not a flash", () => {
    const vms = climbVMs(detail.climbs, SCALES, new Set(["jug life"]));
    expect(vms.map((c) => c.result)).toEqual(["sent", "sent", "project", "flash"]);
  });
});

describe("filterAndSortClimbs", () => {
  it("filters by result and sorts by grade", () => {
    const vms = climbVMs(detail.climbs, SCALES);
    expect(filterAndSortClimbs(vms, "flash", "order").map((c) => c.n)).toEqual([1, 4]);
    expect(filterAndSortClimbs(vms, "all", "gradeDesc").map((c) => c.gradeLabel)).toEqual([
      "V8",
      "V7",
      "V4",
      "V?",
    ]);
    expect(filterAndSortClimbs(vms, "all", "attempts")[0]?.attempts).toBe(4);
  });
});

describe("sessionDetailVM", () => {
  it("builds the stats grid and grade bars", () => {
    const vm = sessionDetailVM(detail, SCALES);
    const byLabel = Object.fromEntries(vm.stats.map((s) => [s.label, s.value]));
    expect(byLabel["Time"]).toBe("1h 35m");
    expect(byLabel["Climbs"]).toBe("4");
    expect(byLabel["Sends"]).toBe("3");
    expect(byLabel["Flashes"]).toBe("2");
    expect(byLabel["Top"]).toBe("V7");
    expect(vm.title).toContain("Tension Board");

    const v7 = vm.bars.find((b) => b.gradeLabel === "V7");
    expect(v7?.peak).toBe(true);
    const v8 = vm.bars.find((b) => b.gradeLabel === "V8");
    expect(v8?.count).toBe(0);
    expect(vm.filterCounts).toEqual({ all: 4, sent: 3, flash: 2, project: 1 });
  });

  it("titles a manual session by its name and shows its location", () => {
    const vm = sessionDetailVM(
      {
        ...detail,
        source: "manual",
        board: null,
        name: "Tuesday board night",
        location: "indoor",
        gym_id: null,
        area_id: null,
        strava_activity_id: null,
        posted_at: null,
        post_state: null,
        post_error: null,
        membership_id: null,
        week: null,
        focus: null,
      },
      SCALES
    );
    expect(vm.title).toContain("Tuesday board night");
    expect(vm.meta).toContain("· Indoor ·");
  });

  it("places an outdoor day at its areas, joined", () => {
    const at = (id: string, name: string) => ({ id, name, slug: id });
    const vm = sessionDetailVM(
      {
        ...detail,
        location: "outdoor",
        areas: [at("a1", "Stanage Popular"), at("a2", "Stanage Plantation")],
      },
      SCALES
    );
    expect(vm.place).toBe("Stanage Popular, Stanage Plantation");
  });

  it("names it without its date, places it in its gym and dates it on its own line", () => {
    const vm = sessionDetailVM(
      { ...detail, name: "Tuesday night session", location: "indoor", gym_id: "g1" },
      SCALES,
      new Set(),
      "The Depot"
    );
    expect(vm.name).toBe("Tuesday night session");
    expect(vm.place).toBe("The Depot");
    expect(vm.when).toMatch(/^Wed Jul 1 · \S.* · 1h 35m$/);
    expect(vm.when).toContain("1h 35m");
    expect(vm.rpe).toBe(7);
  });

  it("falls back to a generic title for an unnamed manual session", () => {
    const vm = sessionDetailVM({ ...detail, source: "manual", board: null, name: null }, SCALES);
    expect(vm.title).toContain("Logged session");
  });
});

describe("route sessions", () => {
  const routes: SessionDetail = {
    ...detail,
    source: "manual",
    board: null,
    top_grade: 4,
    top_send_grade: 3,
    top_grade_label: "5.12a",
    top_send_grade_label: "5.11d",
    climbs: [
      {
        time: "2026-07-01T18:00:00.000Z",
        name: "Warm up",
        vGrade: 0,
        kind: "send",
        tries: 1,
        angle: null,
        grade: { scale: "yds", value: "5.10a" },
        note: null,
        area: null,
        link: null,
      },
      {
        time: "2026-07-01T18:20:00.000Z",
        name: "Pumpfest",
        vGrade: 3,
        kind: "send",
        tries: 2,
        angle: null,
        grade: { scale: "yds", value: "5.11d" },
        note: null,
        area: null,
        link: null,
      },
      {
        time: "2026-07-01T18:50:00.000Z",
        name: "Project",
        vGrade: 4,
        kind: "attempt",
        tries: 3,
        angle: null,
        grade: { scale: "yds", value: "5.12a" },
        note: null,
        area: null,
        link: null,
      },
    ],
  };

  it("labels climbs in the route scale and flags the top route send", () => {
    const vms = climbVMs(routes.climbs, SCALES);
    expect(vms.map((c) => c.gradeLabel)).toEqual(["5.10a", "5.11d", "5.12a"]);
    expect(vms.map((c) => c.isTopSend)).toEqual([false, true, false]);
  });

  it("reports stats and grade bars in the route scale", () => {
    const vm = sessionDetailVM(routes, SCALES);
    const stat = (label: string): string | undefined =>
      vm.stats.find((s) => s.label === label)?.value;
    expect(stat("Top")).toBe("5.11d");
    expect(stat("Avg grade")).toBe("5.11b");
    expect(vm.bars[0]?.gradeLabel).toBe("5.10a");
    expect(vm.bars[vm.bars.length - 1]?.gradeLabel).toBe("5.12a");
    expect(vm.bars.filter((b) => b.count > 0).map((b) => b.gradeLabel)).toEqual(["5.10a", "5.11d"]);
  });

  it("uses the dominant discipline for stats in a mixed session", () => {
    const mixed: SessionDetail = {
      ...routes,
      climbs: [...routes.climbs, { ...detail.climbs[0]!, grade: { scale: "v", value: 4 } }],
    };
    const vm = sessionDetailVM(mixed, SCALES);
    expect(vm.stats.find((s) => s.label === "Top")?.value).toBe("5.11d");
    expect(climbVMs(mixed.climbs, SCALES).map((c) => c.gradeLabel)).toEqual([
      "5.10a",
      "V4",
      "5.11d",
      "5.12a",
    ]);
  });
});
