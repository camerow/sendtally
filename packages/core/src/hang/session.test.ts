import { describe, expect, it } from "vitest";
import { hangSessionSeconds } from "./session";

const protocol = {
  name: "Repeaters",
  kind: "hang" as const,
  hangS: 7,
  restS: 3,
  reps: 6,
  sets: 3,
  setRestS: 60,
};
const sets = Array.from({ length: 3 }, () => ({ reps: 6, onS: 7, offS: 3, setRestS: 60 }));
const dose = { sets: 3, reps: 6, onS: 7, offS: 3, setRestS: 60 };

describe("hangSessionSeconds", () => {
  it("adds each rest between grips the timer ran: three grips of repeaters read 19 minutes", () => {
    const done = [
      { item: 0, exercise: "half", sets, restAfterS: 120 },
      { item: 1, exercise: "open", sets, dose, restAfterS: 120 },
      { item: 2, exercise: "pinch", sets, dose },
    ];
    expect(Math.round(hangSessionSeconds({ gripId: "half", protocol, done }) / 60)).toBe(19);
  });

  it("reads a row saved without rests as before: the grips alone", () => {
    const done = [
      { item: 0, exercise: "half", sets },
      { item: 1, exercise: "open", sets },
      { item: 2, exercise: "pinch", sets },
    ];
    expect(hangSessionSeconds({ gripId: "half", protocol, done })).toBe(3 * 291);
  });
});
