import { describe, expect, it } from "vitest";
import type { Gym } from "../gyms/types";
import {
  newTallyClimb,
  tallyClock,
  tallyDraft,
  tallyElapsedMinutes,
  tallySummary,
  withTallyGo,
} from "./tally";
import { toLogSessionInput } from "./transforms";

const NOW = new Date(2026, 9, 27, 18, 30);

describe("tally", () => {
  it("counts a flash as one try and two falls then a send as three", () => {
    const start = tallyDraft(NOW);
    const flash = newTallyClimb(start, { kind: "grade", scale: "v", grade: "V4" }, "sent");
    expect(flash.draft.climbs[0]).toMatchObject({
      grade: "V4",
      kind: "send",
      style: "flash",
      tries: 1,
    });

    const fell = newTallyClimb(flash.draft, { kind: "grade", scale: "v", grade: "V5" }, "fell");
    const climb = fell.draft.climbs.find((c) => c.key === fell.key)!;
    expect(climb).toMatchObject({ kind: "attempt", tries: 1 });
    const sent = withTallyGo(withTallyGo(climb, "fell"), "sent");
    expect(sent).toMatchObject({ kind: "send", style: "redpoint", tries: 3 });
    expect(tallySummary({ ...fell.draft, climbs: [flash.draft.climbs[0]!, sent] })).toBe(
      "4 tries · 2 sent"
    );
    expect(tallySummary(start)).toBe("No climbs yet");
  });

  it("starts at the clock with the gym and plan, and puts a circuit climb at its gym", () => {
    const plan = { membershipId: "m1", week: 2, variation: 0 };
    const draft = tallyDraft(NOW, { plan });
    expect(draft).toMatchObject({ startTime: "18:30", plan, climbs: [] });
    expect(toLogSessionInput({ ...draft, climbs: [] })).toMatchObject({
      membershipId: "m1",
      week: 2,
      variation: 0,
    });

    const circuit = { id: "c1", colour: "blue", label: "Blue", low: 3, high: 5 } as const;
    const gym = { id: "g1", name: "Arch", scale: "v", circuits: [circuit], walls: [] } as Gym;
    const { draft: next } = newTallyClimb(draft, { kind: "circuit", gym, circuit }, "fell");
    expect(next.gymId).toBe("g1");
    expect(next.climbs[0]?.circuit?.id).toBe("c1");
  });

  it("times the session from its start, past midnight too", () => {
    const draft = tallyDraft(new Date(2026, 9, 27, 23, 50));
    expect(tallyClock(tallyElapsedMinutes(draft, new Date(2026, 9, 28, 1, 2)))).toBe("1:12");
    expect(tallyClock(tallyElapsedMinutes(draft, new Date(2026, 9, 27, 23, 50)))).toBe("0:00");
  });
});
