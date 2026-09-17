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
  enduranceLapValueLabel,
  enduranceProgressLabel,
  enduranceStep,
  enduranceSummaryLabel,
  enduranceTotals,
  isCleanLap,
  removeLap,
  stepEnduranceTarget,
  stepLap,
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

  it("steps time by fifteen seconds and moves by one", () => {
    const ten = draft({ unit: "seconds", target: 600, laps: [600] });
    expect(enduranceStep(endurance(ten))).toBe(15);
    expect(endurance(stepEnduranceTarget(ten, -1)).target).toBe(585);
    expect(endurance(stepEnduranceTarget(ten, 1)).target).toBe(615);
    expect(endurance(stepLap(ten, 0, -1)).laps).toEqual([585]);

    const moves = draft({ unit: "moves", target: 20, laps: [20] });
    expect(enduranceStep(endurance(moves))).toBe(1);
    expect(endurance(stepEnduranceTarget(moves, 1)).target).toBe(21);
    expect(endurance(stepEnduranceTarget(moves, -1)).target).toBe(19);
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

  it("carries a clean lap up to a raised target and leaves a partial one alone", () => {
    const fresh = draft(defaultEndurance());
    expect(endurance(withEnduranceTarget(fresh, 32)).laps).toEqual([32]);

    const mixed = draft({ unit: "moves", target: 32, laps: [32, 24] });
    expect(endurance(withEnduranceTarget(mixed, 40)).laps).toEqual([40, 24]);
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
  it("reads progress in one unit on both sides", () => {
    expect(enduranceProgressLabel({ unit: "moves", target: 32, laps: [32, 32, 24] })).toBe(
      "88 of 96 moves"
    );
    expect(enduranceProgressLabel({ unit: "seconds", target: 720, laps: [720, 720, 720] })).toBe(
      "36 min of 36 min"
    );
    expect(enduranceProgressLabel({ unit: "seconds", target: 720, laps: [720, 720, 450] })).toBe(
      "31 min 30 sec of 36 min"
    );
    expect(enduranceProgressLabel({ unit: "seconds", target: 135, laps: [120] })).toBe(
      "2 min of 2 min 15 sec"
    );
    expect(enduranceProgressLabel({ unit: "seconds", target: 45, laps: [30] })).toBe(
      "30 sec of 45 sec"
    );
  });

  it("reads a single lap in the short form", () => {
    const moves: Endurance = { unit: "moves", target: 32, laps: [32, 24] };
    expect(enduranceLapLabel(moves, 1)).toBe("24/32 moves");
    const time: Endurance = { unit: "seconds", target: 720, laps: [450] };
    expect(enduranceLapLabel(time, 0)).toBe("7 min 30 sec/12 min");
  });

  it("reads a lap chip as a bare pair for moves and as the amount for time", () => {
    const moves: Endurance = { unit: "moves", target: 32, laps: [32, 24] };
    expect(enduranceLapValueLabel(moves, 0)).toBe("32");
    expect(enduranceLapValueLabel(moves, 1)).toBe("24/32");
    const time: Endurance = { unit: "seconds", target: 720, laps: [720, 450] };
    expect(enduranceLapValueLabel(time, 0)).toBe("12 min");
    expect(enduranceLapValueLabel(time, 1)).toBe("7 min 30 sec");
  });

  it("singularises one move and one lap", () => {
    expect(enduranceAmountLabel({ unit: "moves", target: 1, laps: [1] }, 1)).toBe("1 move");
    expect(enduranceLapCountLabel(1)).toBe("1 lap");
    expect(enduranceLapCountLabel(3)).toBe("3 laps");
  });

  it("sums a finished circuit and falls back to the pair once a lap is partial", () => {
    expect(enduranceSummaryLabel({ unit: "seconds", target: 720, laps: [720, 720, 720] })).toBe(
      "36 min, all clean"
    );
    expect(enduranceSummaryLabel({ unit: "moves", target: 32, laps: [32, 32] })).toBe(
      "64 moves, all clean"
    );
    expect(enduranceSummaryLabel({ unit: "moves", target: 32, laps: [32, 32, 24] })).toBe(
      "88 of 96 moves"
    );
  });

  it("counts clean laps", () => {
    expect(enduranceCleanLabel({ unit: "moves", target: 32, laps: [32, 32, 24] })).toBe(
      "2 of 3 clean"
    );
  });

  it("reads minutes and seconds in the reader's language", () => {
    setLocale("de");
    expect(enduranceProgressLabel({ unit: "seconds", target: 720, laps: [720, 720, 450] })).toBe(
      "31 Min 30 Sek von 36 Min"
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
