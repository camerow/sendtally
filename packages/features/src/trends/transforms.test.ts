import { describe, expect, it } from "vitest";
import type { SessionClimb, SessionTag, SessionWithClimbs } from "@sendtally/api-client";
import { bucketsFor, trendsVM } from "./transforms";

const NOW = new Date("2026-08-06T12:00:00.000Z");

function tag(name: string): SessionTag {
  return { id: `id-${name}`, name, slug: name.toLowerCase() };
}

function session(
  startIso: string,
  climbs: Array<Partial<SessionClimb> & { vGrade: number }>,
  tags: SessionTag[] = []
): SessionWithClimbs {
  return {
    fingerprint: `fp-${startIso}-${tags.map((t) => t.slug).join("-")}`,
    board: "tension",
    source: "board",
    location: null,
    name: null,
    start_at: startIso,
    end_at: startIso,
    climb_count: climbs.length,
    top_grade: Math.max(...climbs.map((c) => c.vGrade)),
    top_send_grade: Math.max(...climbs.filter((c) => c.kind === "send").map((c) => c.vGrade), -1),
    top_grade_label: null,
    top_send_grade_label: null,
    notes: null,
    rpe: 6,
    title: "",
    strava_activity_id: null,
    posted_at: null,
    post_state: null,
    post_error: null,
    tags,
    climbs: climbs.map((c, i) => ({
      time: startIso,
      name: `c${i}`,
      kind: "send",
      tries: 1,
      angle: 40,
      ...c,
    })),
  };
}

const sessions: SessionWithClimbs[] = [
  session("2026-08-01T18:00:00.000Z", [{ vGrade: 4 }, { vGrade: 5, tries: 3 }, { vGrade: 7 }]),
  session("2026-07-20T18:00:00.000Z", [{ vGrade: 5 }, { vGrade: 6, tries: 2 }]),
  session("2026-05-10T18:00:00.000Z", [{ vGrade: 4 }, { vGrade: 5 }]),
];

describe("trendsVM", () => {
  it("computes the pyramid with the top grade as peak", () => {
    const vm = trendsVM(sessions, "1y", NOW);
    const pyramid = vm.details.pyramid;
    expect(pyramid.bars.map((b) => b.axisLabel)).toEqual(["V4", "V5", "V6", "V7"]);
    expect(pyramid.bars.map((b) => b.valueLabel)).toEqual(["2", "3", "1", "1"]);
    expect(pyramid.bars[3]?.peak).toBe(true);
    expect(pyramid.bars[1]?.height).toBe(1);
  });

  it("computes flash rate per month from first-try sends", () => {
    const vm = trendsVM(sessions, "1y", NOW);
    const flash = vm.details.flash;
    const aug = flash.bars[flash.bars.length - 1];
    expect(aug?.valueLabel).toBe("67%");
    const may = flash.bars[flash.bars.length - 4];
    expect(may?.valueLabel).toBe("100%");
  });

  it("tracks hardest send by month and marks improvements", () => {
    const vm = trendsVM(sessions, "1y", NOW);
    const hardest = vm.details.hardest;
    const labels = hardest.bars.map((b) => b.valueLabel);
    expect(labels[labels.length - 1]).toBe("V7");
    expect(labels[labels.length - 2]).toBe("V6");
    expect(labels[labels.length - 4]).toBe("V5");
    expect(hardest.bars[hardest.bars.length - 1]?.peak).toBe(true);
  });

  it("scopes volume to the selected range", () => {
    const vm = trendsVM(sessions, "1m", NOW);
    const volume = vm.tiles.find((t) => t.metric === "volume");
    expect(volume?.value).toBe("5 climbs");
    expect(volume?.caption).toContain("2 SESSIONS");
    expect(volume?.caption).toContain("LAST MONTH");

    const all = trendsVM(sessions, "all", NOW);
    expect(all.tiles.find((t) => t.metric === "volume")?.value).toBe("7 climbs");
  });

  it("excludes sessions outside the range from the pyramid", () => {
    const vm = trendsVM(sessions, "1m", NOW);
    expect(vm.tiles.find((t) => t.metric === "pyramid")?.value).toBe("5 sends");
  });

  it("labels the y axis top-down and blanks it with no data", () => {
    const vm = trendsVM(sessions, "all", NOW);
    expect(vm.details.hardest.yTicks[2]).toBe("V0");
    expect(vm.details.hardest.yTicks[0]).toBe(
      `V${vm.tiles.find((t) => t.metric === "hardest")!.value.slice(1)}`
    );
    expect(vm.details.flash.yTicks[2]).toBe("0%");
    expect(trendsVM([], "all", NOW).details.volume.yTicks).toEqual(["", "", ""]);
  });

  it("handles an empty logbook", () => {
    const vm = trendsVM([], "all", NOW);
    expect(vm.tiles.find((t) => t.metric === "hardest")?.value).toBe("-");
    expect(vm.details.pyramid.specs[2]?.v).toBe("0 sends");
  });
});

describe("trendsVM tag breakdown", () => {
  const endurance = tag("Endurance");
  const projecting = tag("Projecting");
  const tagged: SessionWithClimbs[] = [
    session("2026-08-01T18:00:00.000Z", [{ vGrade: 3 }, { vGrade: 4 }], [endurance]),
    session("2026-08-02T18:00:00.000Z", [{ vGrade: 3 }], [endurance]),
    session("2026-08-03T18:00:00.000Z", [{ vGrade: 7, tries: 4 }], [projecting]),
    session("2026-08-04T18:00:00.000Z", [{ vGrade: 5 }]),
  ];

  it("ranks tags by the metric and counts an untagged group", () => {
    const { breakdown } = trendsVM(tagged, "1m", NOW).details.volume;
    expect(breakdown).toEqual([
      { key: "endurance", label: "Endurance", value: "3", ratio: 1, sessions: 2 },
      { key: "projecting", label: "Projecting", value: "1", ratio: 1 / 3, sessions: 1 },
      { key: "untagged", label: "Untagged", value: "1", ratio: 1 / 3, sessions: 1 },
    ]);
  });

  it("scores each metric against the tag's own sessions", () => {
    const details = trendsVM(tagged, "1m", NOW).details;
    expect(details.hardest.breakdown[0]).toMatchObject({ key: "projecting", value: "V7" });
    expect(details.flash.breakdown.find((r) => r.key === "projecting")?.value).toBe("0%");
    expect(details.avggrade.breakdown.find((r) => r.key === "endurance")?.value).toBe("V3.3");
  });

  it("is empty when no session in range carries a tag", () => {
    expect(trendsVM([], "1m", NOW).details.volume.breakdown).toEqual([]);
  });
});

describe("bucketsFor", () => {
  it("builds year-to-date month buckets", () => {
    const buckets = bucketsFor("ytd", NOW, null);
    expect(buckets).toHaveLength(8);
    expect(buckets[0]?.label).toBe("JAN");
    expect(buckets[7]?.label).toBe("AUG");
  });

  it("uses month buckets for short histories and year buckets for long ones", () => {
    const shortSpan = bucketsFor("all", NOW, Date.parse("2026-01-15T00:00:00.000Z"));
    expect(shortSpan.map((b) => b.label)).toContain("JAN");
    const longSpan = bucketsFor("all", NOW, Date.parse("2022-03-15T00:00:00.000Z"));
    expect(longSpan.map((b) => b.label)).toEqual(["2022", "2023", "2024", "2025", "2026"]);
  });
});

describe("disciplines", () => {
  const routeSessions: SessionWithClimbs[] = [
    session("2026-08-01T18:00:00.000Z", [
      { vGrade: 2, grade: { scale: "yds", value: "5.11a" } },
      { vGrade: 4, grade: { scale: "yds", value: "5.12a" }, tries: 2 },
    ]),
    session("2026-07-20T18:00:00.000Z", [{ vGrade: 3, grade: { scale: "yds", value: "5.11d" } }]),
  ];

  it("reads a route-only logbook in the route scale", () => {
    const vm = trendsVM(routeSessions, "1y", NOW);
    expect(vm.discipline).toBe("route");
    expect(vm.disciplines).toEqual(["route"]);
    expect(vm.details.pyramid.bars.map((b) => b.axisLabel)).toEqual([
      "5.11a",
      "5.11b",
      "5.11c",
      "5.11d",
      "5.12a",
    ]);
    expect(vm.tiles.find((t) => t.metric === "hardest")?.value).toBe("5.12a");
    expect(vm.tiles.find((t) => t.metric === "avggrade")?.value).toBe("5.11c");
    expect(vm.details.flash.specs[0]?.v).toBe("5.11d - hardest flash");
  });

  it("offers both disciplines and follows the requested one", () => {
    const both = [...sessions, ...routeSessions];
    const auto = trendsVM(both, "1y", NOW);
    expect(auto.disciplines).toEqual(["boulder", "route"]);
    expect(auto.discipline).toBe("boulder");
    expect(auto.tiles.find((t) => t.metric === "hardest")?.value).toBe("V7");

    const routes = trendsVM(both, "1y", NOW, "route");
    expect(routes.discipline).toBe("route");
    expect(routes.tiles.find((t) => t.metric === "hardest")?.value).toBe("5.12a");
    expect(routes.tiles.find((t) => t.metric === "volume")?.value).toBe("10 climbs");
  });

  it("uses French labels when most routes were logged in French", () => {
    const french = routeSessions.map((s) => ({
      ...s,
      climbs: s.climbs.map((c) => ({
        ...c,
        grade: { scale: "french" as const, value: c.vGrade === 4 ? "7a+" : "6c" },
      })),
    }));
    expect(trendsVM(french, "1y", NOW).tiles.find((t) => t.metric === "hardest")?.value).toBe(
      "7a+"
    );
  });

  it("falls back to boulders for an empty logbook", () => {
    const vm = trendsVM([], "1y", NOW, "route");
    expect(vm.discipline).toBe("boulder");
    expect(vm.disciplines).toEqual([]);
  });
});
