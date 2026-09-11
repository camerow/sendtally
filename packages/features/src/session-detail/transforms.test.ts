import { describe, expect, it } from "vitest";
import type { SessionDetail } from "@sendtally/api-client";
import { climbVMs, filterAndSortClimbs, sessionDetailVM } from "./transforms";

const detail: SessionDetail = {
  fingerprint: "42-1",
  board: "tension",
  source: "board",
  location: null,
  name: null,
  start_at: "2026-07-01T17:50:00.000Z",
  end_at: "2026-07-01T19:25:00.000Z",
  climb_count: 4,
  top_grade: 7,
  top_send_grade: 7,
  top_grade_label: null,
  top_send_grade_label: null,
  notes: null,
  rpe: 7,
  title: "Solid climbing session · 4 climbs, top V7",
  strava_activity_id: 555,
  posted_at: "2026-07-02T00:00:00.000Z",
  post_state: "posted",
  post_error: null,
  tags: [],
  climbs: [
    {
      time: "2026-07-01T18:00:00.000Z",
      name: "Jug Life",
      vGrade: 4,
      kind: "send",
      tries: 1,
      angle: 40,
    },
    {
      time: "2026-07-01T18:20:00.000Z",
      name: "Crimp Reaper",
      vGrade: 7,
      kind: "send",
      tries: 3,
      angle: 40,
    },
    {
      time: "2026-07-01T18:50:00.000Z",
      name: "Mind Meld",
      vGrade: 8,
      kind: "attempt",
      tries: 4,
      angle: 45,
    },
    { time: "2026-07-01T19:20:00.000Z", name: "", vGrade: -1, kind: "send", tries: 1, angle: null },
  ],
};

describe("climbVMs", () => {
  it("derives result, rest, and top-send flags in climb order", () => {
    const vms = climbVMs(detail.climbs);
    expect(vms.map((c) => c.result)).toEqual(["flash", "sent", "project", "flash"]);
    expect(vms.map((c) => c.restLabel)).toEqual(["-", "20m", "30m", "30m"]);
    expect(vms[1]?.isTopSend).toBe(true);
    expect(vms[2]?.isTopSend).toBe(false);
    expect(vms[3]?.name).toBe("Unknown climb");
    expect(vms[3]?.gradeLabel).toBe("V?");
    expect(vms[2]?.angleLabel).toBe("45°");
  });
});

describe("filterAndSortClimbs", () => {
  it("filters by result and sorts by grade", () => {
    const vms = climbVMs(detail.climbs);
    expect(filterAndSortClimbs(vms, "flash", "order").map((c) => c.n)).toEqual([1, 4]);
    expect(filterAndSortClimbs(vms, "all", "gradeDesc").map((c) => c.gradeLabel)).toEqual([
      "V8",
      "V7",
      "V4",
      "V?",
    ]);
    expect(filterAndSortClimbs(vms, "all", "burns")[0]?.burns).toBe(4);
  });
});

describe("sessionDetailVM", () => {
  it("builds the stats grid and grade bars", () => {
    const vm = sessionDetailVM(detail);
    const byLabel = Object.fromEntries(vm.stats.map((s) => [s.label, s.value]));
    expect(byLabel["TIME"]).toBe("1h 35m");
    expect(byLabel["CLIMBS"]).toBe("4");
    expect(byLabel["SENDS"]).toBe("3");
    expect(byLabel["FLASHES"]).toBe("2");
    expect(byLabel["TOP"]).toBe("V7");
    expect(vm.title).toContain("Tension Board");
    expect(vm.stravaUrl).toBe("https://www.strava.com/activities/555");
    expect(vm.post.label).toBe("ON STRAVA · POSTED JUL 2");

    const v7 = vm.bars.find((b) => b.gradeLabel === "V7");
    expect(v7?.peak).toBe(true);
    const v8 = vm.bars.find((b) => b.gradeLabel === "V8");
    expect(v8?.count).toBe(0);
    expect(vm.filterCounts).toEqual({ all: 4, sent: 3, flash: 2, project: 1 });
  });

  it("marks a settled, unposted board session as read-only history", () => {
    const vm = sessionDetailVM({
      ...detail,
      strava_activity_id: null,
      posted_at: null,
      post_state: null,
      post_error: null,
    });
    expect(vm.post.kind).toBe("legacy");
    expect(vm.post.label).toBe("TENSION BOARD · READ-ONLY HISTORY");
    expect(vm.post.action).toBeNull();
  });

  it("shows ON STRAVA for a posted session", () => {
    const vm = sessionDetailVM(detail);
    expect(vm.post.label).toBe("ON STRAVA · POSTED JUL 2");
  });

  it("titles a manual session by its name and shows its location", () => {
    const vm = sessionDetailVM({
      ...detail,
      source: "manual",
      board: null,
      name: "Tuesday board night",
      location: "indoor",
      strava_activity_id: null,
      posted_at: null,
      post_state: null,
      post_error: null,
    });
    expect(vm.title).toContain("Tuesday board night");
    expect(vm.meta).toContain("· INDOOR ·");
    expect(vm.post.label).toBe("LOGGED MANUALLY");
  });

  const unposted = {
    ...detail,
    source: "manual" as const,
    board: null,
    strava_activity_id: null,
    posted_at: null,
    post_state: null,
    post_error: null,
  };
  const connected = { connected: true, active: true, since: null };

  it("offers a post action only when Strava is connected and active", () => {
    expect(sessionDetailVM(unposted, connected).post.action).toBe("post");
    expect(
      sessionDetailVM(unposted, { connected: true, active: false, since: null }).post.action
    ).toBeNull();
    expect(
      sessionDetailVM(unposted, { connected: false, active: false, since: null }).post.action
    ).toBeNull();
    expect(sessionDetailVM(unposted, null).post.action).toBeNull();
  });

  it("surfaces the failure reason with a retry action", () => {
    const vm = sessionDetailVM(
      { ...unposted, post_state: "failed", post_error: "strava rate limit hit, not posted yet" },
      connected
    );
    expect(vm.post.kind).toBe("failed");
    expect(vm.post.alert).toBe(true);
    expect(vm.post.detail).toBe("strava rate limit hit, not posted yet");
    expect(vm.post.action).toBe("retry");
  });

  it("reports a pending post without an action", () => {
    const vm = sessionDetailVM({ ...unposted, post_state: "pending" }, connected);
    expect(vm.post.kind).toBe("pending");
    expect(vm.post.label).toBe("POSTING TO STRAVA");
    expect(vm.post.action).toBeNull();
  });

  it("explains a session that starts before the posting start date", () => {
    const vm = sessionDetailVM(unposted, {
      connected: true,
      active: true,
      since: "2026-08-01T00:00:00Z",
    });
    expect(vm.post.kind).toBe("before-start");
    expect(vm.post.detail).toBe("Earlier than your posting start date");
    expect(vm.post.actionLabel).toBe("Post anyway");
  });

  it("does not call a session before-start when it starts after the date", () => {
    const vm = sessionDetailVM(unposted, {
      connected: true,
      active: true,
      since: "2026-01-01T00:00:00Z",
    });
    expect(vm.post.kind).toBe("off");
  });

  it("falls back to a generic title for an unnamed manual session", () => {
    const vm = sessionDetailVM({ ...detail, source: "manual", board: null, name: null });
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
      },
      {
        time: "2026-07-01T18:20:00.000Z",
        name: "Pumpfest",
        vGrade: 3,
        kind: "send",
        tries: 2,
        angle: null,
        grade: { scale: "yds", value: "5.11d" },
      },
      {
        time: "2026-07-01T18:50:00.000Z",
        name: "Project",
        vGrade: 4,
        kind: "attempt",
        tries: 3,
        angle: null,
        grade: { scale: "yds", value: "5.12a" },
      },
    ],
  };

  it("labels climbs in the route scale and flags the top route send", () => {
    const vms = climbVMs(routes.climbs);
    expect(vms.map((c) => c.gradeLabel)).toEqual(["5.10a", "5.11d", "5.12a"]);
    expect(vms.map((c) => c.isTopSend)).toEqual([false, true, false]);
  });

  it("reports stats and grade bars in the route scale", () => {
    const vm = sessionDetailVM(routes);
    const stat = (label: string): string | undefined =>
      vm.stats.find((s) => s.label === label)?.value;
    expect(stat("TOP")).toBe("5.11d");
    expect(stat("AVG GRADE")).toBe("5.11b");
    expect(vm.bars[0]?.gradeLabel).toBe("5.10a");
    expect(vm.bars[vm.bars.length - 1]?.gradeLabel).toBe("5.12a");
    expect(vm.bars.filter((b) => b.count > 0).map((b) => b.gradeLabel)).toEqual(["5.10a", "5.11d"]);
  });

  it("uses the dominant discipline for stats in a mixed session", () => {
    const mixed: SessionDetail = {
      ...routes,
      climbs: [...routes.climbs, { ...detail.climbs[0]!, grade: { scale: "v", value: 4 } }],
    };
    const vm = sessionDetailVM(mixed);
    expect(vm.stats.find((s) => s.label === "TOP")?.value).toBe("5.11d");
    expect(climbVMs(mixed.climbs).map((c) => c.gradeLabel)).toEqual([
      "5.10a",
      "V4",
      "5.11d",
      "5.12a",
    ]);
  });
});
