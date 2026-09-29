import { describe, expect, it } from "vitest";
import type { HangHistoryRow } from "@sendtally/api-client";
import { hangEffortLabel, hangMetaLabel, hangTitle } from "./hang";

const row = (over: Partial<HangHistoryRow> = {}): HangHistoryRow => ({
  id: "h1",
  workoutId: "rep73",
  gripId: "half",
  gripName: null,
  date: "2026-09-28",
  loadKg: 4,
  pct: 83,
  misses: 2,
  rpe: 7,
  protocol: {
    name: "Repeaters 7:3",
    kind: "hang",
    hangS: 7,
    restS: 3,
    reps: 6,
    sets: 6,
    setRestS: 180,
    edgeMm: 20,
  },
  stravaActivityId: null,
  postState: null,
  postError: null,
  updatedAt: "2026-09-28T19:00:00.000Z",
  ...over,
});

describe("hang history rows", () => {
  it("labels a library workout on a built-in grip", () => {
    expect(hangTitle(row())).toBe("Repeaters 7:3");
    expect(hangMetaLabel(row())).toBe("Hangboard session · Half crimp · +4 kg");
    expect(hangEffortLabel(row())).toBe("RPE 7");
  });

  it("uses the user's own workout and grip names, and a pull's plain weight", () => {
    const pull = row({
      workoutId: "w-uuid",
      gripId: "g-uuid",
      gripName: "Wide pinch",
      loadKg: 30,
      rpe: null,
      protocol: { ...row().protocol, name: "Block day", kind: "pull" },
    });
    expect(hangTitle(pull)).toBe("Block day");
    expect(hangMetaLabel(pull)).toBe("Hangboard session · Wide pinch · 30 kg");
    expect(hangEffortLabel(pull)).toBeNull();
  });

  it("reads a bodyweight hang and leaves out a grip it cannot name", () => {
    expect(hangMetaLabel(row({ loadKg: 0, gripId: "gone" }))).toBe(
      "Hangboard session · Bodyweight"
    );
  });
});
