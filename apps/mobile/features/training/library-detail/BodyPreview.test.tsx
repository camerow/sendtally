import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import { sessionItems } from "@sendtally/core/hang";
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
    await render(
      <BodyPreview
        items={sessionItems(workout.items, 0)}
        exerciseRestS={workout.exerciseRestS}
        unit="kg"
        kindOf={() => "strength"}
        eachSide={() => false}
      />
    );
    expect([
      ...new Set(
        readingOrder(
          "Superset · 3 rounds",
          "Rest 0:30",
          "Rest 1:30",
          "Pull-ups",
          "Push-ups",
          "Plank"
        )
      ),
    ]).toEqual(["Superset · 3 rounds", "Pull-ups", "Rest 0:30", "Push-ups", "Rest 1:30", "Plank"]);
    expect(screen.getByText("6 reps")).toBeTruthy();
    expect(screen.getByText("3 sets × 0:45")).toBeTruthy();
    expect(screen.getAllByText("Superset · 3 rounds")).toHaveLength(1);
  });
});
