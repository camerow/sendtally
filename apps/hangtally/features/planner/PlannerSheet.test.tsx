import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import React from "react";
import { hangData, renderWithHang, TODAY } from "../data/renderWithHang";
import { PlannerSheet } from "./PlannerSheet";

jest.mock("../../components/Sheet", () => ({
  Sheet: ({
    visible,
    children,
    footer,
  }: {
    visible: boolean;
    children: React.ReactNode;
    footer?: React.ReactNode;
  }) =>
    visible ? (
      <>
        {children}
        {footer}
      </>
    ) : null,
}));
jest.mock("expo-crypto", () => {
  let n = 0;
  return { randomUUID: () => `id-${++n}` };
});

describe("Plan a block", () => {
  it("creates one scheduled workout per chosen grip, with the same days and dates", async () => {
    const { actions } = await renderWithHang(
      <PlannerSheet
        request={{ mode: "new", workoutId: null, gripId: null, days: [1], start: TODAY }}
        onClose={() => undefined}
      />
    );
    expect(screen.getByText("Pick a workout.")).toBeTruthy();

    await fireEvent.press(screen.getByText("Repeaters 7:3"));
    await fireEvent.press(screen.getByLabelText("Grips, Half crimp"));
    await fireEvent.press(screen.getByText("Open hand"));
    await fireEvent.press(screen.getByLabelText("Friday"));
    expect(screen.getByText(/2 workouts · 8 sessions each/)).toBeTruthy();

    await fireEvent.press(screen.getAllByText("Add to schedule").at(-1)!);
    const [saved] = actions.saveSchedules.mock.calls[0]!;
    expect(saved.map((s) => s.gripId)).toEqual(["half", "open"]);
    expect(saved.every((s) => s.start === TODAY && s.end === "2026-10-27")).toBe(true);
    expect(saved.every((s) => s.days.join() === "1,4")).toBe(true);
  });

  it("changes exactly one scheduled workout in edit mode", async () => {
    const schedule = {
      id: "s1",
      workoutId: "max10",
      gripId: "half",
      days: [0 as const],
      start: TODAY,
      end: null,
      skip: [],
    };
    const { actions } = await renderWithHang(
      <PlannerSheet request={{ mode: "edit", schedule }} onClose={() => undefined} />,
      hangData({ schedules: [schedule] })
    );
    await fireEvent.press(screen.getByText("After"));
    await fireEvent.press(screen.getByText("Save changes"));
    expect(actions.saveSchedules).toHaveBeenCalledWith([{ ...schedule, end: "2026-10-27" }]);
  });
});
