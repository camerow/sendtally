import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import { readingOrder } from "../data/renderWithHang";
import { BodyPreview } from "./BodyPreview";

describe("A workout's body with a superset", () => {
  it("heads the members with their rounds and rests between them by the superset's rest", async () => {
    const group = { id: "s1", rounds: 3, restBetweenS: 30, restRoundS: 120 };
    const workout = {
      id: "w1",
      kind: "strength",
      name: "Pull and push",
      description: "",
      minutes: 30,
      targetRpe: null,
      exerciseRestS: 90,
      focus: null,
      items: [
        { exercise: "Pull-ups", doses: [{ sets: 3, reps: 6 }], group },
        { exercise: "Push-ups", doses: [{ sets: 3, reps: 15 }], group },
        { exercise: "Plank", doses: [{ sets: 3, onS: 45 }] },
      ],
    } as unknown as LibraryWorkout;
    await render(<BodyPreview workout={workout} unit="kg" session={0} tally={() => null} />);
    expect(
      readingOrder("Superset · 3 rounds", "0:30 rest", "1:30 rest", "Pull-ups", "Push-ups", "Plank")
    ).toEqual(["Superset · 3 rounds", "Pull-ups", "0:30 rest", "Push-ups", "1:30 rest", "Plank"]);
    expect(screen.getAllByText("Superset · 3 rounds")).toHaveLength(1);
  });
});
