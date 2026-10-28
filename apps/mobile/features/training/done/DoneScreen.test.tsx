import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { hangData, renderWithHang, TODAY } from "../data/renderWithHang";
import { DoneScreen } from "./DoneScreen";

jest.mock("expo-router", () => ({ router: { dismissTo: jest.fn(), push: jest.fn() } }));
jest.mock("expo-crypto", () => ({ randomUUID: () => "session-1" }));

const partial = {
  workoutId: "rep73",
  gripId: "half",
  edgeMm: 20,
  loadKg: 4,
  result: { ended: true, setsDone: 2, pct: 30, work: 76, misses: 2, seconds: 312 },
  link: { membershipId: "m1", week: 3 },
  session: 0,
  more: [],
};

describe("Session done", () => {
  it("explains a partial and logs it with effort, a protocol snapshot and the sets done", async () => {
    const { actions } = await renderWithHang(<DoneScreen params={partial} />);
    expect(screen.getByText("Ended early · Half crimp")).toBeTruthy();
    expect(screen.getByText("5:12")).toBeTruthy();
    expect(screen.getByText(/Came off early on 2 hangs\. Ended after 2 of 6 sets\./)).toBeTruthy();

    await fireEvent.press(screen.getByLabelText("Shallower edge"));
    await fireEvent.press(screen.getByLabelText("More weight"));
    await fireEvent.press(screen.getByLabelText("Effort 8 of 10"));
    expect(screen.getByText("Very hard")).toBeTruthy();
    await fireEvent.press(screen.getByText("Log session"));

    expect(actions.saveSession).toHaveBeenCalledWith({
      id: "session-1",
      workoutId: "rep73",
      gripId: "half",
      date: TODAY,
      edgeMm: 19,
      loadKg: 5,
      pct: 30,
      misses: 2,
      rpe: 8,
      protocol: expect.objectContaining({ name: "Repeaters 7:3", hangS: 7, sets: 6 }),
      membershipId: "m1",
      week: 3,
      done: [
        {
          item: 0,
          exercise: "half",
          sets: Array.from({ length: 2 }, () => ({
            reps: 6,
            onS: 7,
            offS: 3,
            setRestS: 180,
            edgeMm: 19,
            weightKg: 5,
          })),
        },
      ],
    });
    expect(router.dismissTo).toHaveBeenCalledWith("/(tabs)/sessions");
    expect(router.push).toHaveBeenCalledWith("/statistics");
  });

  it("logs every item of a workout with more than one, each with its own setup", async () => {
    const twoGrips = {
      id: "w-two",
      kind: "hangboard" as const,
      name: "Two grips",
      description: "",
      minutes: null,
      targetRpe: null,
      items: [
        { exercise: "half", doses: [{ sets: 2, reps: 1, onS: 10, setRestS: 60 }] },
        { exercise: "open", doses: [{ sets: 3, reps: 1, onS: 10, setRestS: 60 }] },
      ],
      exerciseRestS: 120,
      updatedAt: "t",
    };
    const { actions } = await renderWithHang(
      <DoneScreen
        params={{
          workoutId: "w-two",
          gripId: "half",
          edgeMm: 20,
          loadKg: 4,
          result: { ended: true, setsDone: 2, pct: 80, work: 40, misses: 0, seconds: 400 },
          link: { membershipId: null, week: null },
          session: 0,
          more: [{ edgeMm: 15, loadKg: 0, setsDone: 2 }],
        }}
      />,
      hangData(),
      { workouts: [twoGrips] }
    );
    expect(screen.getByText("40s / 50s")).toBeTruthy();
    await fireEvent.press(screen.getByText("Log session"));
    expect(actions.saveSession).toHaveBeenCalledWith(
      expect.objectContaining({
        workoutId: "w-two",
        gripId: "half",
        done: [
          {
            item: 0,
            exercise: "half",
            sets: Array.from({ length: 2 }, () => ({
              reps: 1,
              onS: 10,
              setRestS: 60,
              edgeMm: 20,
              weightKg: 4,
            })),
          },
          {
            item: 1,
            exercise: "open",
            sets: Array.from({ length: 2 }, () => ({
              reps: 1,
              onS: 10,
              setRestS: 60,
              edgeMm: 15,
              weightKg: 0,
            })),
          },
        ],
      })
    );
  });
});
