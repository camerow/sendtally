import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import { Alert } from "react-native";
import React from "react";
import { newActivityDraft } from "@sendtally/features/activities";
import { ActivityForm } from "./ActivityForm";

const mockActions = { saveActivity: jest.fn(), deleteActivity: jest.fn() };

jest.mock("../../../components/Sheet", () => ({ Sheet: () => null }));
jest.mock("expo-router", () => ({ router: { back: jest.fn() } }));
jest.mock("../../../lib/api", () => ({ useApi: () => undefined }));
jest.mock("@sendtally/features/activities", () => ({
  ...jest.requireActual<object>("@sendtally/features/activities"),
  useActivityActions: () => mockActions,
}));

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
