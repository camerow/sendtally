import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import { Alert } from "react-native";
import React from "react";
import type { PlanTemplate } from "@sendtally/api-client";
import { newActivityDraft } from "@sendtally/features/activities";
import { ActivityForm } from "./ActivityForm";

const mockActions = { saveActivity: jest.fn(), deleteActivity: jest.fn() };

jest.mock("../../../components/Sheet", () => ({ Sheet: () => null }));
jest.mock("expo-router", () => ({ router: { back: jest.fn() } }));
jest.mock("../../../lib/api", () => ({ useApi: () => undefined }));
jest.mock("@sendtally/features/activities", () => ({
  ...jest.requireActual<object>("@sendtally/features/activities"),
  useActivityActions: () => mockActions,
  useExerciseNames: () => ["Back squat", "Deadlift"],
  usePlanTemplate: () => mockTemplate,
  useWeightUnit: () => "kg",
}));

let mockTemplate: PlanTemplate | null = null;

describe("Log activity", () => {
  it("saves an untitled activity under its kind's name with its effort and load", async () => {
    await render(
      <ActivityForm id="a1" initial={newActivityDraft({}, "2026-10-22")} editing={false} />
    );
    await fireEvent.press(screen.getByText("Mobility"));
    await fireEvent.press(screen.getByLabelText("5 minutes less"));
    await fireEvent.press(screen.getByLabelText("Effort 7 of 10"));
    expect(screen.getByText("55 min × 7 = 385")).toBeTruthy();
    await fireEvent.press(screen.getByText("Save"));

    expect(mockActions.saveActivity).toHaveBeenCalledWith({
      id: "a1",
      kind: "mobility",
      title: "Mobility",
      date: "2026-10-22",
      startTime: null,
      minutes: 55,
      rpe: 7,
      notes: null,
      planItemId: null,
      detail: null,
    });
    expect(router.back).toHaveBeenCalled();
  });

  it("logs sets against a plan's targets, suggesting exercises already logged", async () => {
    mockTemplate = {
      kind: "sets",
      exercises: [
        { name: "Back squat", measures: ["reps", "loadKg"], sets: [{ reps: 5, loadKg: 100 }] },
      ],
    };
    const initial = newActivityDraft({ planItemId: "p1" }, "2026-10-22", mockTemplate);
    await render(<ActivityForm id="a1" initial={initial} editing={false} />);
    expect(screen.getByText("5 × 100 kg")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Set 1 done"));
    await fireEvent.press(screen.getByText("Add set"));
    await fireEvent.press(screen.getByText("Add exercise"));
    const names = screen.getAllByLabelText("Exercise");
    await fireEvent(names[1]!, "focus");
    await fireEvent.press(screen.getByText("Deadlift"));
    await fireEvent.press(screen.getByText("Save"));

    expect(mockActions.saveActivity).toHaveBeenLastCalledWith(
      expect.objectContaining({
        planItemId: "p1",
        detail: {
          kind: "sets",
          exercises: [
            {
              name: "Back squat",
              measures: ["reps", "loadKg"],
              sets: [
                { reps: 5, loadKg: 100, done: true },
                { reps: 5, loadKg: 100, done: false },
              ],
            },
            { name: "Deadlift", measures: ["reps", "loadKg"], sets: [{ done: false }] },
          ],
        },
      })
    );
    mockTemplate = null;
  });

  it("ticks, orders and saves a checklist", async () => {
    await render(
      <ActivityForm id="a1" initial={newActivityDraft({}, "2026-10-22")} editing={false} />
    );
    await fireEvent.press(screen.getByText("Add checklist"));
    await fireEvent.changeText(screen.getByPlaceholderText("Deep squat hold"), "Cat-cow");
    await fireEvent.changeText(screen.getByLabelText("Dose"), "× 10");
    await fireEvent.press(screen.getByText("Add item"));
    await fireEvent.changeText(
      screen.getAllByPlaceholderText("Deep squat hold")[1]!,
      "Deep squat hold"
    );
    await fireEvent.press(screen.getByLabelText("Move up"));
    await fireEvent.press(screen.getByLabelText("Deep squat hold"));
    await fireEvent.press(screen.getByText("Save"));

    expect(mockActions.saveActivity).toHaveBeenLastCalledWith(
      expect.objectContaining({
        detail: {
          kind: "checklist",
          items: [
            { text: "Deep squat hold", dose: "", done: true },
            { text: "Cat-cow", dose: "× 10", done: false },
          ],
        },
      })
    );
  });

  it("deletes an existing activity only once confirmed", async () => {
    const alert = jest.spyOn(Alert, "alert");
    await render(<ActivityForm id="a1" initial={newActivityDraft({}, "2026-10-22")} editing />);
    await fireEvent.press(screen.getByText("Delete activity"));
    expect(mockActions.deleteActivity).not.toHaveBeenCalled();
    const buttons = alert.mock.calls[0]?.[2] ?? [];
    buttons.find((b) => b.style === "destructive")?.onPress?.();
    expect(mockActions.deleteActivity).toHaveBeenCalledWith("a1");
  });
});
