import type { ClimbSummary } from "@sendtally/api-client";
import { describe, expect, it } from "vitest";
import { withCircuit } from "../gyms/draft";
import { climbKindOf, readClimbKind, withClimbKind } from "./climbKind";
import { draftStorage, parseStoredDraft, writeStoredDraft, type DraftStorage } from "./draftStore";
import {
  defaultSessionName,
  liveStoredDraft,
  withClimbName,
  withPickedClimb,
  withGymAdopted,
  withQuickClimb,
} from "./liveSession";
import { DEFAULT_GRADE_PREFS } from "./types";

const EVENING = new Date(2026, 8, 16, 18, 42);

describe("live session", () => {
  it("names the session by time of day and date", () => {
    expect(defaultSessionName(new Date(2026, 8, 12, 9, 0))).toBe("Morning session, 9/12/26");
    expect(defaultSessionName(new Date(2026, 8, 12, 14, 0))).toBe("Afternoon session, 9/12/26");
    expect(defaultSessionName(EVENING)).toBe("Evening session, 9/16/26");
  });

  it("starts a session at the first climb, leaving its times to add later", () => {
    const first = withQuickClimb(null, EVENING);
    expect(first.key).toBe("climb-1");
    expect(first.draft.startTime).toBe("");
    expect(first.draft.endTime).toBe("");
    expect(first.draft.climbs).toHaveLength(1);

    const second = withQuickClimb(first.draft, new Date(2026, 8, 16, 19, 31));
    expect(second.key).toBe("climb-2");
    expect(second.draft.climbs[1]?.scale).toBe(first.draft.climbs[0]?.scale);
  });

  const gym = {
    id: "g",
    name: "Barn",
    scale: "v" as const,
    walls: [],
    circuits: [
      { id: "a", colour: "blue" as const, label: "", low: 0, high: 2 },
      { id: "b", colour: "red" as const, label: "", low: 4, high: 6 },
    ],
  };

  it("grades a climb as a boulder until a gym's circuits have been picked", () => {
    const first = withQuickClimb(null, EVENING, undefined, [gym]);
    expect(first.draft.gymId).toBeUndefined();
    expect(first.draft.climbs[0]).toMatchObject({ scale: "v", grade: "V3" });
    expect(first.draft.climbs[0]?.circuit).toBeUndefined();
    const route = withQuickClimb(first.draft, EVENING, undefined, [gym], "route");
    expect(route.draft.climbs[1]).toMatchObject({ scale: "yds", grade: "5.10b" });
  });

  it("adopts the gym of a climb moved onto its circuits, and keeps a gym already picked", () => {
    const { draft } = withQuickClimb(null, EVENING, undefined, [gym]);
    const onBarn = withClimbKind(draft.climbs[0]!, "g", DEFAULT_GRADE_PREFS, [gym]);
    expect(withGymAdopted({ ...draft, climbs: [onBarn] }, [gym]).gymId).toBe("g");
    expect(withGymAdopted({ ...draft, climbs: [onBarn], gymId: "other" }, [gym]).gymId).toBe(
      "other"
    );
    expect(withGymAdopted(draft, [gym])).toBe(draft);
  });

  it("switches a climb between disciplines and a gym's circuits", () => {
    const climb = withQuickClimb(null, EVENING).draft.climbs[0]!;
    const onBarn = withClimbKind(climb, "g", DEFAULT_GRADE_PREFS, [gym]);
    expect(onBarn).toMatchObject({ grade: "V1", circuit: { id: "a" } });
    expect(climbKindOf(onBarn, [gym])).toBe("g");
    const onRed = withCircuit(onBarn, gym.circuits[1]!, gym);
    expect(withClimbKind(onRed, "g", DEFAULT_GRADE_PREFS, [gym]).circuit?.id).toBe("b");
    const route = withClimbKind(onRed, "route", DEFAULT_GRADE_PREFS, [gym]);
    expect(route.circuit).toBeUndefined();
    expect(climbKindOf(route, [gym])).toBe("route");
    expect(withClimbKind(route, "gone", DEFAULT_GRADE_PREFS, [gym])).toBe(route);
  });

  it("reads the last picked kind, bouldering when there is none or its gym is gone", () => {
    const stored = (value: string | null): DraftStorage => ({
      read: () => value,
      write: () => true,
      remove: () => undefined,
      subscribe: () => () => undefined,
    });
    expect(readClimbKind(stored(null), [gym])).toBe("boulder");
    expect(readClimbKind(stored("nonsense"), [gym])).toBe("boulder");
    expect(readClimbKind(stored("route"), [])).toBe("route");
    expect(readClimbKind(stored("g"), [gym])).toBe("g");
    expect(readClimbKind(stored("g"), [])).toBe("boulder");
  });

  it("puts each circuit climb on the previous circuit, or the first, and adopts the gym", () => {
    const first = withQuickClimb(null, EVENING, undefined, [gym], "g");
    expect(first.draft.gymId).toBe("g");
    expect(first.draft.climbs[0]).toMatchObject({ grade: "V1", circuit: { id: "a" } });
    const moved = {
      ...first.draft,
      climbs: first.draft.climbs.map((c) => ({
        ...c,
        grade: "V5",
        circuit: { id: "b", label: "Red", colour: "red" as const },
      })),
    };
    const second = withQuickClimb(moved, EVENING, undefined, [gym], "g");
    expect(second.draft.climbs[1]).toMatchObject({ grade: "V5", circuit: { id: "b" } });
    const late = withQuickClimb(
      withQuickClimb(null, EVENING).draft,
      EVENING,
      undefined,
      [gym],
      "g"
    );
    expect(late.draft.gymId).toBe("g");
    expect(late.draft.climbs[1]).toMatchObject({ circuit: { id: "a" } });
  });

  it("shows only today's draft, dropping an older one the server already has", () => {
    let value: string | null = null;
    const storage = draftStorage({
      read: () => value,
      write: (next) => {
        value = next;
      },
      remove: () => {
        value = null;
      },
    });
    const draft = withQuickClimb(null, EVENING).draft;
    writeStoredDraft(storage, draft, EVENING, "manual-1");
    expect(liveStoredDraft(storage, EVENING)?.fingerprint).toBe("manual-1");
    const tomorrow = new Date(2026, 8, 17, 7, 0);
    expect(liveStoredDraft(storage, tomorrow)).toBeNull();
    expect(storage.read()).toBeNull();

    writeStoredDraft(storage, draft, EVENING);
    expect(liveStoredDraft(storage, tomorrow)).toBeNull();
    expect(parseStoredDraft(storage.read(), tomorrow)?.draft).toEqual(draft);
  });

  it("adopts a known climb's grade on a typed name and keeps it otherwise", () => {
    const climb = withQuickClimb(null, EVENING).draft.climbs[0]!;
    const known: ClimbSummary = {
      slug: "orange-crimp-arete",
      name: "Orange crimp arete",
      grade: { scale: "v", value: 6 },
      discipline: "boulder",
      project: true,
      sessions: 4,
      attempts: 11,
      sends: 0,
      first_at: "2026-06-03T18:00:00.000Z",
      last_at: "2026-09-04T18:00:00.000Z",
    };
    expect(withClimbName({ ...climb, project: true }, "Ora", undefined)).toMatchObject({
      name: "Ora",
      grade: climb.grade,
      project: undefined,
    });
    expect(withClimbName(climb, known.name, known).grade).toBe("V6");
    expect(withPickedClimb(climb, known).project).toBe(true);
    expect(withPickedClimb(climb, { ...known, project: false }).project).toBeUndefined();
  });
});
