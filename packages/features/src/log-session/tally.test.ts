import { describe, expect, it, vi } from "vitest";
import type { Gym } from "../gyms/types";
import { draftStorage, writeStoredDraft, type DraftStorage } from "./draftStore";
import {
  finishLiveSession,
  newTallyClimb,
  tallyDraft,
  tallyElapsedSeconds,
  tallySummary,
  withTallyGo,
  type FinishApi,
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

  it("starts at the clock with the gym, plan and focus, and puts a circuit climb at its gym", () => {
    const plan = { membershipId: "m1", week: 2, focus: "power" as const };
    const draft = tallyDraft(NOW, { plan });
    expect(draft).toMatchObject({ startTime: "18:30", plan, climbs: [] });
    expect(toLogSessionInput({ ...draft, climbs: [] })).toMatchObject({
      membershipId: "m1",
      week: 2,
      focus: "power",
    });

    const circuit = { id: "c1", colour: "blue", label: "Blue", low: 3, high: 5 } as const;
    const gym = { id: "g1", name: "Arch", scale: "v", circuits: [circuit], walls: [] } as Gym;
    const { draft: next } = newTallyClimb(draft, { kind: "circuit", gym, circuit }, "fell");
    expect(next.gymId).toBe("g1");
    expect(next.climbs[0]?.circuit?.id).toBe("c1");
  });

  it("times the session from its start to the second, and from the minute for an older draft", () => {
    const draft = tallyDraft(new Date(2026, 9, 27, 23, 50, 30), { name: "Hangboard repeaters" });
    expect(draft.name).toBe("Hangboard repeaters");
    expect(tallyElapsedSeconds(draft, new Date(2026, 9, 28, 1, 2, 31))).toBe(72 * 60 + 1);
    const { startedAt: _s, ...older } = draft;
    expect(tallyElapsedSeconds(older, new Date(2026, 9, 28, 1, 2, 31))).toBe(72 * 60);
  });

  it("writes to the server once, on finish, with the end time and effort", async () => {
    let value: string | null = null;
    const storage: DraftStorage = draftStorage({
      read: () => value,
      write: (next) => {
        value = next;
      },
      remove: () => {
        value = null;
      },
    });
    const session = { fingerprint: "manual-1" } as Awaited<
      ReturnType<FinishApi["logSession"]>
    >["session"];
    const api: FinishApi = {
      logSession: vi.fn(async () => ({ session })),
      updateLoggedSession: vi.fn(async () => ({ session })),
    };
    const { draft } = newTallyClimb(
      tallyDraft(NOW),
      { kind: "grade", scale: "v", grade: "V4" },
      "sent"
    );
    writeStoredDraft(storage, draft, NOW);
    expect(await finishLiveSession(api, storage, 7, new Date(2026, 9, 27, 20, 5))).toBe("manual-1");
    expect(api.logSession).toHaveBeenCalledTimes(1);
    expect(vi.mocked(api.logSession).mock.calls[0]?.[0]).toMatchObject({
      startTime: "18:30",
      endTime: "20:05",
      rpe: 7,
    });
    expect(api.updateLoggedSession).not.toHaveBeenCalled();
    expect(value).toBeNull();

    writeStoredDraft(storage, tallyDraft(NOW), NOW);
    expect(await finishLiveSession(api, storage, null)).toBeNull();
    expect(api.logSession).toHaveBeenCalledTimes(1);
    expect(value).toBeNull();
  });
});
