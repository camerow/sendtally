import { afterEach, describe, expect, it } from "vitest";
import type { Gym } from "../gyms/types";
import { setLocale } from "../i18n";
import {
  addLap,
  asEnduranceClimb,
  defaultEndurance,
  enduranceAmountLabel,
  enduranceCleanLabel,
  enduranceLapCountLabel,
  enduranceLapLabel,
  enduranceProgressLabel,
  enduranceStep,
  enduranceTimeUnit,
  enduranceTotals,
  isCleanLap,
  removeLap,
  withEnduranceTarget,
  withEnduranceUnit,
  withLap,
  withoutEndurance,
  type Endurance,
} from "./endurance";
import { climbKindOf, newClimbOfKind, readClimbKind, withClimbKind } from "./climbKind";
import { newClimb } from "./transforms";
import type { ClimbDraft } from "./types";

afterEach(() => setLocale("en"));

function draft(e?: Endurance): ClimbDraft {
  const base = newClimb("climb-1", "v");
  return e === undefined
    ? base
    : { ...base, kind: "send", style: "redpoint", tries: 1, endurance: e };
}

function endurance(c: ClimbDraft): Endurance {
  if (c.endurance === undefined) throw new Error("expected an endurance climb");
  return c.endurance;
}

describe("defaults and steppers", () => {
  it("starts on one clean lap of twenty moves", () => {
    expect(defaultEndurance()).toEqual({ unit: "moves", target: 20, laps: [20] });
  });

  it("steps moves by one and seconds by fifteen", () => {
    expect(enduranceStep("moves")).toBe(1);
    expect(enduranceStep("seconds")).toBe(15);
  });

  it("forces send, redpoint and one try, and drops a project flag", () => {
    const c = asEnduranceClimb({
      ...draft(),
      kind: "attempt",
      style: "flash",
      tries: 7,
      project: true,
    });
    expect(c.kind).toBe("send");
    expect(c.style).toBe("redpoint");
    expect(c.tries).toBe(1);
    expect(c.project).toBeUndefined();
    expect(withoutEndurance(c).endurance).toBeUndefined();
  });
});

describe("unit switching", () => {
  it("resets the target and the laps rather than converting the numbers", () => {
    const moves = withEnduranceTarget(asEnduranceClimb(draft()), 32);
    const seconds = withEnduranceUnit(moves, "seconds");
    expect(endurance(seconds)).toEqual({ unit: "seconds", target: 600, laps: [600] });
    expect(endurance(withEnduranceUnit(seconds, "moves"))).toEqual({
      unit: "moves",
      target: 20,
      laps: [20],
    });
  });
});

describe("target and laps", () => {
  it("clamps the target to the validator bounds", () => {
    expect(endurance(withEnduranceTarget(draft(defaultEndurance()), 0)).target).toBe(1);
    expect(endurance(withEnduranceTarget(draft(defaultEndurance()), 9999)).target).toBe(3600);
  });

  it("clamps every lap down to a lowered target", () => {
    const c = draft({ unit: "moves", target: 32, laps: [32, 24, 8] });
    expect(endurance(withEnduranceTarget(c, 16)).laps).toEqual([16, 16, 8]);
  });

  it("appends a clean lap and clamps an edited one", () => {
    const c = addLap(draft({ unit: "moves", target: 32, laps: [32] }));
    expect(endurance(c).laps).toEqual([32, 32]);
    expect(endurance(withLap(c, 1, 40)).laps).toEqual([32, 32]);
    expect(endurance(withLap(c, 1, -5)).laps).toEqual([32, 0]);
    expect(endurance(withLap(c, 9, 4)).laps).toEqual([32, 32]);
  });

  it("stops at sixty laps", () => {
    const full = draft({ unit: "moves", target: 8, laps: Array(60).fill(8) });
    expect(endurance(addLap(full)).laps).toHaveLength(60);
  });

  it("never drops below one lap", () => {
    const two = draft({ unit: "moves", target: 32, laps: [32, 24] });
    expect(endurance(removeLap(two)).laps).toEqual([32]);
    expect(endurance(removeLap(removeLap(two))).laps).toEqual([32]);
  });

  it("reads a lap as clean only at the target", () => {
    const e: Endurance = { unit: "moves", target: 32, laps: [32, 24] };
    expect(isCleanLap(e, 0)).toBe(true);
    expect(isCleanLap(e, 1)).toBe(false);
    expect(enduranceTotals(e)).toEqual({ laps: 2, done: 56, total: 64, clean: 1 });
  });
});

describe("labels", () => {
  it("picks the time unit once from the lap target", () => {
    expect(enduranceTimeUnit(720)).toBe("min");
    expect(enduranceTimeUnit(135)).toBe("sec");
    expect(enduranceTimeUnit(45)).toBe("sec");
  });

  it("reads progress in one unit on both sides", () => {
    expect(enduranceProgressLabel({ unit: "moves", target: 32, laps: [32, 32, 24] })).toBe(
      "88 of 96 moves"
    );
    expect(enduranceProgressLabel({ unit: "seconds", target: 720, laps: [720, 720, 720] })).toBe(
      "36 min of 36 min"
    );
    expect(enduranceProgressLabel({ unit: "seconds", target: 720, laps: [720, 720, 450] })).toBe(
      "31.5 min of 36 min"
    );
    expect(enduranceProgressLabel({ unit: "seconds", target: 135, laps: [120] })).toBe(
      "120 sec of 135 sec"
    );
  });

  it("reads a single lap in the short form", () => {
    const moves: Endurance = { unit: "moves", target: 32, laps: [32, 24] };
    expect(enduranceLapLabel(moves, 1)).toBe("24/32 moves");
    const time: Endurance = { unit: "seconds", target: 720, laps: [450] };
    expect(enduranceLapLabel(time, 0)).toBe("7.5 min/12 min");
  });

  it("singularises one move and one lap", () => {
    expect(enduranceAmountLabel({ unit: "moves", target: 1, laps: [1] }, 1)).toBe("1 move");
    expect(enduranceLapCountLabel(1)).toBe("1 lap");
    expect(enduranceLapCountLabel(3)).toBe("3 laps");
  });

  it("counts clean laps", () => {
    expect(enduranceCleanLabel({ unit: "moves", target: 32, laps: [32, 32, 24] })).toBe(
      "2 of 3 clean"
    );
  });

  it("formats decimals for the reader's locale", () => {
    setLocale("de");
    expect(enduranceProgressLabel({ unit: "seconds", target: 720, laps: [720, 720, 450] })).toBe(
      "31,5 min von 36 min"
    );
  });
});

describe("the endurance climb kind", () => {
  const gym: Gym = {
    id: "gym-1",
    name: "The Cave",
    scale: "v",
    circuits: [{ id: "c-1", label: "Red", colour: "red", low: 2, high: 4 }],
    walls: [],
  };
  const prefs = { boulder: "v", route: "yds" } as const;

  it("wins over a circuit when both are set", () => {
    const onCircuit = withClimbKind(draft(), gym.id, prefs, [gym]);
    expect(climbKindOf(onCircuit, [gym])).toBe(gym.id);
    const asEndurance = withClimbKind(onCircuit, "endurance", prefs, [gym]);
    expect(climbKindOf(asEndurance, [gym])).toBe("endurance");
    expect(asEndurance.circuit).toBeUndefined();
    expect(asEndurance.endurance).toEqual(defaultEndurance());
  });

  it("strips endurance when moving back off it", () => {
    const asEndurance = withClimbKind(draft(), "endurance", prefs, [gym]);
    expect(withClimbKind(asEndurance, "route", prefs, [gym]).endurance).toBeUndefined();
    expect(withClimbKind(asEndurance, gym.id, prefs, [gym]).endurance).toBeUndefined();
  });

  it("makes a new endurance climb and remembers the kind", () => {
    expect(newClimbOfKind("climb-2", "endurance", prefs, [gym], undefined).endurance).toEqual(
      defaultEndurance()
    );
    const storage = {
      read: () => "endurance",
      write: () => true,
      remove: () => {},
      subscribe: () => () => {},
    };
    expect(readClimbKind(storage, [])).toBe("endurance");
  });
});
