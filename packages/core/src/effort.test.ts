import { describe, expect, it } from "vitest";
import {
  MOVES_PER_EQUIVALENT,
  SECONDS_PER_EQUIVALENT,
  defaultEffortConfig,
  dominantDiscipline,
  enduranceEquivalents,
  enduranceTimeUnit,
  enduranceTotals,
  isEndurance,
  points,
  score,
  sessionPoints,
  topGradeLabel,
  type Climb,
  type Endurance,
  type Session,
} from "./effort";
import { effortGrade } from "./grades";

function at(day: number, hour: number, minute: number): Date {
  return new Date(2026, 6, day, hour, minute);
}

function mkSession(day: number, hour: number, n: number, grade: number): Session {
  const climbs = Array.from({ length: n }, (_, i) => ({
    time: at(day, hour, i * 10),
    vGrade: grade,
    name: "",
    kind: "send" as const,
    tries: 1,
  }));
  const first = climbs[0]!;
  const last = climbs[climbs.length - 1]!;
  return {
    start: new Date(first.time.getTime() - 10 * 60_000),
    end: new Date(last.time.getTime() + 5 * 60_000),
    climbs,
  };
}

function history6(climbsPerSession: number, grade: number): Session[] {
  return Array.from({ length: 6 }, (_, i) => mkSession(i + 1, 18, climbsPerSession, grade));
}

describe("points", () => {
  it("grows exponentially with grade", () => {
    expect(points(0)).toBe(1);
    expect(points(2)).toBe(2);
    expect(points(4)).toBe(4);
    expect(points(6)).toBe(8);
  });

  it("scores unknown grades as V1", () => {
    expect(points(-1)).toBe(points(1));
  });
});

describe("sessionPoints", () => {
  it("weights attempts at the bid weight", () => {
    const s: Session = {
      start: at(1, 18, 0),
      end: at(1, 19, 0),
      climbs: [
        { time: at(1, 18, 0), vGrade: 4, name: "", kind: "send", tries: 1 },
        { time: at(1, 18, 10), vGrade: 4, name: "", kind: "attempt", tries: 1 },
      ],
    };
    expect(sessionPoints(s, defaultEffortConfig())).toBe(4 + 4 * 0.4);
  });
});

describe("score", () => {
  it("scores the median session as RPE 6", () => {
    const history = history6(10, 4);
    const res = score(mkSession(10, 18, 10, 4), history, defaultEffortConfig());
    expect(res.rpe).toBe(6);
    expect(res.title).toContain("Solid climbing session");
    expect(res.title).toContain("10 climbs, top V4");
  });

  it("scores small sessions below 6 and big sessions above 6", () => {
    const history = history6(10, 4);
    const small = score(mkSession(10, 18, 4, 3), history, defaultEffortConfig());
    const big = score(mkSession(10, 18, 18, 5), history, defaultEffortConfig());
    expect(small.rpe).toBeLessThan(6);
    expect(big.rpe).toBeGreaterThan(6);
  });

  it("nudges up when projecting above the rolling max", () => {
    const history = history6(10, 4);
    const base = mkSession(10, 18, 10, 4);
    const project = mkSession(10, 18, 10, 4);
    project.climbs[9] = { ...project.climbs[9]!, vGrade: 6, kind: "attempt" };
    const baseRes = score(base, history, defaultEffortConfig());
    const projRes = score(project, history, defaultEffortConfig());
    expect(projRes.rpe).toBeGreaterThan(baseRes.rpe);
  });

  it("defaults to near 6 with no history", () => {
    const res = score(mkSession(10, 18, 10, 4), [], defaultEffortConfig());
    expect(res.rpe).toBeGreaterThanOrEqual(5);
    expect(res.rpe).toBeLessThanOrEqual(7);
  });

  it("renders the summary stats line and climb log", () => {
    const s: Session = {
      start: at(1, 17, 50),
      end: at(1, 18, 25),
      climbs: [
        { time: at(1, 18, 0), vGrade: 4, name: "Jug Life", kind: "send", tries: 1 },
        { time: at(1, 18, 10), vGrade: 7, name: "Crimp Reaper", kind: "send", tries: 1 },
        { time: at(1, 18, 20), vGrade: 7, name: "Crimp Reaper", kind: "attempt", tries: 3 },
      ],
    };
    const res = score(s, [], defaultEffortConfig());
    for (const want of [
      "2 sends",
      "1 attempt",
      "V4-V7",
      "avg V6.0",
      "created by https://sendtally.com",
      "RPE",
      "✓ V4 Jug Life",
      "✓ V7 Crimp Reaper",
      "✗ V7 Crimp Reaper (3 tries)",
    ]) {
      expect(res.summary).toContain(want);
    }
    const lines = res.summary.split("\n");
    expect(lines[1]).toBe("created by https://sendtally.com");
    expect(lines[2]).toBe("✓ V4 Jug Life");
  });

  it("omits grade stats when no grades are known", () => {
    const s: Session = {
      start: at(1, 17, 50),
      end: at(1, 18, 5),
      climbs: [{ time: at(1, 18, 0), vGrade: -1, name: "", kind: "attempt", tries: 1 }],
    };
    const res = score(s, [], defaultEffortConfig());
    expect(res.summary).not.toContain("avg");
    expect(res.summary).toContain("✗ V?");
  });

  it("uses the singular for one climb", () => {
    const res = score(mkSession(10, 18, 1, 4), [], defaultEffortConfig());
    expect(res.title).toContain("1 climb,");
    expect(res.title).not.toContain("1 climbs");
  });

  it("labels high-scoring sessions well below the rolling max as volume", () => {
    const history = history6(8, 6);
    const volume = score(mkSession(10, 18, 40, 3), history, defaultEffortConfig());
    expect(volume.rpe).toBeGreaterThanOrEqual(8);
    expect(volume.title).toContain("volume climbing session");
    if (volume.rpe === 10) {
      expect(volume.title).toContain("Max volume climbing session");
    }
    const limit = score(mkSession(10, 18, 40, 6), history, defaultEffortConfig());
    expect(limit.title).not.toContain("volume climbing session");
    const near = score(mkSession(10, 18, 40, 5), history, defaultEffortConfig());
    expect(near.title).not.toContain("volume climbing session");
  });

  it("uses the RPE override for the rating, title, and summary", () => {
    const history = history6(8, 4);
    const target = mkSession(10, 18, 8, 4);
    const auto = score(target, history, defaultEffortConfig());
    expect(auto.rpe).toBe(6);
    const overridden = score(target, history, defaultEffortConfig(), 9);
    expect(overridden.rpe).toBe(9);
    expect(overridden.title).toContain("Hard climbing session");
    expect(overridden.summary).toContain("RPE 9/10");
  });

  it("clamps the RPE override to 1-10", () => {
    expect(score(mkSession(10, 18, 3, 4), [], defaultEffortConfig(), 0).rpe).toBe(1);
    expect(score(mkSession(10, 18, 3, 4), [], defaultEffortConfig(), 12).rpe).toBe(10);
  });
});

describe("route grades in titles and summaries", () => {
  function route(minute: number, yds: string, kind: "send" | "attempt" = "send"): Climb {
    return {
      time: at(1, 18, minute),
      vGrade: effortGrade({ scale: "yds", value: yds }),
      name: "",
      kind,
      tries: 1,
      grade: { scale: "yds", value: yds },
    };
  }

  function session(climbs: Climb[]): Session {
    return { start: at(1, 17, 50), end: at(1, 19, 0), climbs };
  }

  it("titles a route session with its top route grade", () => {
    const res = score(
      session([route(0, "5.10a"), route(10, "5.11b"), route(20, "5.12a", "attempt")]),
      [],
      defaultEffortConfig()
    );
    expect(res.title).toContain("3 climbs, top 5.12a");
  });

  it("prints route ranges and averages in the route scale", () => {
    const res = score(
      session([route(0, "5.10a"), route(10, "5.11b"), route(20, "5.10c")]),
      [],
      defaultEffortConfig()
    );
    expect(res.summary).toContain("5.10a-5.11b · avg 5.10c");
    expect(res.summary).toContain("✓ 5.11b");
    expect(res.summary).not.toContain("V");
  });

  it("prints french grades as entered", () => {
    const climb: Climb = {
      time: at(1, 18, 0),
      vGrade: effortGrade({ scale: "french", value: "7a" }),
      name: "Biographie lite",
      kind: "send",
      tries: 2,
      grade: { scale: "french", value: "7a" },
    };
    const res = score(session([climb]), [], defaultEffortConfig());
    expect(res.title).toContain("1 climb, top 7a");
    expect(res.summary).toContain("7a-7a · avg 7a");
    expect(res.summary).toContain("✓ 7a Biographie lite (2 tries)");
  });

  it("keeps V grades for climbs without an explicit grade", () => {
    const res = score(mkSession(1, 18, 3, 5), [], defaultEffortConfig());
    expect(res.title).toContain("top V5");
    expect(res.summary).toContain("V5-V5 · avg V5.0");
  });

  it("reports both disciplines in a mixed session and titles by the dominant one", () => {
    const boulder: Climb = { time: at(1, 18, 5), vGrade: 6, name: "", kind: "send", tries: 1 };
    const res = score(
      session([route(0, "5.11a"), route(10, "5.11d"), boulder]),
      [],
      defaultEffortConfig()
    );
    expect(res.title).toContain("3 climbs, top 5.11d");
    expect(res.summary).toContain("V6-V6 · avg V6.0 · 5.11a-5.11d · avg 5.11c");
  });

  it("scores routes through their effort equivalent", () => {
    expect(sessionPoints(session([route(0, "5.12a")]), defaultEffortConfig())).toBe(points(4));
  });
});

describe("endurance", () => {
  function enduranceClimb(e: Endurance, vGrade = 3, name = ""): Climb {
    return { time: at(1, 18, 0), vGrade, name, kind: "send", tries: 1, endurance: e };
  }

  const cases: Array<[string, Endurance, number]> = [
    ["a clean moves circuit", { unit: "moves", target: 96, laps: [96] }, 12],
    ["three clean moves laps", { unit: "moves", target: 32, laps: [32, 32, 32] }, 12],
    ["a partial moves lap", { unit: "moves", target: 32, laps: [32, 32, 24] }, 11],
    ["a clean timed circuit", { unit: "seconds", target: 720, laps: [720, 720, 720] }, 24],
    ["a partial timed lap", { unit: "seconds", target: 720, laps: [720, 360] }, 12],
  ];

  it.each(cases)("counts equivalents for %s", (_name, e, want) => {
    expect(enduranceEquivalents(e)).toBe(want);
  });

  it("divides by the calibration knob for each unit", () => {
    expect(MOVES_PER_EQUIVALENT).toBe(8);
    expect(SECONDS_PER_EQUIVALENT).toBe(90);
  });

  it("scores a partial lap below a clean one and skips the bid weight", () => {
    const cfg = defaultEffortConfig();
    const clean = enduranceClimb({ unit: "moves", target: 32, laps: [32, 32, 32] });
    const partial = enduranceClimb({ unit: "moves", target: 32, laps: [32, 32, 24] });
    const one = (c: Climb): number =>
      sessionPoints({ start: at(1, 17, 50), end: at(1, 19, 0), climbs: [c] }, cfg);
    expect(one(partial)).toBeLessThan(one(clean));
    expect(one(clean)).toBe(points(3) * 12);
    expect(one({ ...clean, kind: "attempt" })).toBe(one(clean));
  });

  it("keeps an endurance grade out of the top grade and the dominant discipline", () => {
    const boulder: Climb = { time: at(1, 18, 10), vGrade: 4, name: "", kind: "send", tries: 1 };
    const route = enduranceClimb({ unit: "seconds", target: 720, laps: [720] }, 8);
    const routeGraded: Climb = { ...route, grade: { scale: "yds", value: "5.13a" } };
    expect(topGradeLabel([boulder, routeGraded])).toBe("V4");
    expect(dominantDiscipline([boulder, routeGraded])).toBe("boulder");
    expect(isEndurance(routeGraded)).toBe(true);
    expect(isEndurance(boulder)).toBe(false);
  });

  it("never lets an endurance grade suppress the volume title", () => {
    const history = history6(8, 6);
    const base = mkSession(10, 18, 40, 3);
    expect(score(base, history, defaultEffortConfig()).title).toContain("volume climbing session");

    const withCircuit: Session = {
      ...base,
      climbs: [...base.climbs, enduranceClimb({ unit: "seconds", target: 720, laps: [720] }, 7)],
    };
    expect(score(withCircuit, history, defaultEffortConfig()).title).toContain(
      "volume climbing session"
    );
  });

  it("never lets an endurance grade count as a personal best", () => {
    const history = history6(10, 4);
    const base = mkSession(10, 18, 10, 4);
    const hard: Climb = { time: at(10, 18, 90), vGrade: 9, name: "", kind: "send", tries: 1 };
    const rest = base.climbs.slice(0, 9);
    const asEndurance = score(
      {
        ...base,
        climbs: [...rest, { ...hard, endurance: { unit: "moves", target: 8, laps: [8] } }],
      },
      history,
      defaultEffortConfig()
    );
    const asSend = score({ ...base, climbs: [...rest, hard] }, history, defaultEffortConfig());
    expect(asEndurance.rpe).toBeLessThan(asSend.rpe);
  });

  it("writes the laps and progress into the Strava climb line", () => {
    const climbs = [
      enduranceClimb({ unit: "moves", target: 32, laps: [32, 32, 24] }, 3, "Red 40"),
      {
        ...enduranceClimb({ unit: "seconds", target: 720, laps: [720, 720, 720] }, 4),
        grade: { scale: "yds", value: "5.10c" } as const,
        time: at(1, 18, 30),
      },
      enduranceClimb({ unit: "seconds", target: 90, laps: [45] }, 2),
    ];
    const res = score(
      { start: at(1, 17, 50), end: at(1, 19, 0), climbs },
      [],
      defaultEffortConfig()
    );
    expect(res.summary).toContain("✓ V3 Red 40 (3 laps · 88 of 96 moves)");
    expect(res.summary).toContain("✓ 5.10c (3 laps · 36 min of 36 min)");
    expect(res.summary).toContain("✓ V2 (1 lap · 45 sec of 90 sec)");
  });

  it("renders both sides of a time pair in the unit the lap target picks", () => {
    expect(enduranceTimeUnit(720)).toBe("min");
    expect(enduranceTimeUnit(90)).toBe("sec");
    expect(enduranceTimeUnit(30)).toBe("sec");
    const partial = enduranceClimb({ unit: "seconds", target: 720, laps: [720, 720, 450] }, 3);
    const res = score(
      { start: at(1, 17, 50), end: at(1, 19, 0), climbs: [partial] },
      [],
      defaultEffortConfig()
    );
    expect(res.summary).toContain("✓ V3 (3 laps · 31.5 min of 36 min)");
  });

  it("totals laps, work and clean laps from the one array", () => {
    expect(enduranceTotals({ unit: "moves", target: 32, laps: [32, 32, 24] })).toEqual({
      laps: 3,
      done: 88,
      total: 96,
      clean: 2,
    });
  });
});

describe("density counts laps, not circuits", () => {
  function circuits(target: number, laps: number[]): Session {
    const climbs: Climb[] = [0, 30, 60].map((minute) => ({
      time: at(1, 18, minute),
      vGrade: 3,
      name: "",
      kind: "send" as const,
      tries: 1,
      endurance: { unit: "moves" as const, target, laps },
    }));
    return { start: at(1, 17, 50), end: at(1, 19, 10), climbs };
  }

  const fiveLaps = circuits(32, [32, 32, 32, 32, 32]);
  const oneLongLap = circuits(160, [160]);

  it("scores the same work identically before the density nudge", () => {
    const cfg = defaultEffortConfig();
    expect(sessionPoints(fiveLaps, cfg)).toBe(sessionPoints(oneLongLap, cfg));
  });

  it("nudges up on fifteen laps and down on three", () => {
    expect(score(fiveLaps, [], defaultEffortConfig()).rpe).toBe(7);
    expect(score(oneLongLap, [], defaultEffortConfig()).rpe).toBe(5);
  });

  it("still calls three circuits three climbs", () => {
    expect(score(fiveLaps, [], defaultEffortConfig()).title).toContain("3 climbs");
  });
});
