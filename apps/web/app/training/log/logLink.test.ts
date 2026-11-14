import { describe, expect, it } from "vitest";
import type { WorkoutRecord } from "@sendtally/api-client";
import { libraryOf } from "@sendtally/features/workouts";
import { logLink } from "./logLink";

const legs: WorkoutRecord = {
  id: "legs",
  kind: "strength",
  name: "Gym, legs",
  description: "",
  minutes: 50,
  targetRpe: null,
  items: [{ exercise: "Back squat", doses: [{ sets: 5, reps: 5 }] }],
  exerciseRestS: 180,
  focus: "strength",
  updatedAt: "t",
};

const params = (url: string | null): URLSearchParams =>
  new URLSearchParams((url ?? "").split("?")[1] ?? "");

describe("logLink", () => {
  it("opens a lift's review with the workout, its day and its next session", () => {
    const [w] = libraryOf([legs]).filter((x) => x.id === "legs");
    const url = logLink(w!, "2026-11-12", 3);
    expect(url?.startsWith("/app/activity/new?")).toBe(true);
    const p = params(url);
    expect(p.get("workoutId")).toBe("legs");
    expect(p.get("kind")).toBe("strength");
    expect(p.get("date")).toBe("2026-11-12");
    expect(p.get("session")).toBe("3");
  });

  it("opens a hangboard workout's review on its first grip", () => {
    const max = libraryOf([]).find((w) => w.kind === "hangboard")!;
    const url = logLink(max, "2026-11-12", 0);
    expect(url?.startsWith("/app/workout/done?")).toBe(true);
    expect(params(url).get("workoutId")).toBe(max.id);
    expect(params(url).get("gripId")).not.toBe("");
  });

  it("offers nothing for a workout with nothing in it", () => {
    const [empty] = libraryOf([{ ...legs, id: "empty", items: [] }]).filter(
      (x) => x.id === "empty"
    );
    expect(logLink(empty!, "2026-11-12", 0)).toBeNull();
  });
});
