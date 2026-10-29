import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { Alert } from "react-native";
import { anExercise, renderWithHang } from "../data/renderWithHang";
import { ExerciseEditorScreen } from "./ExerciseEditorScreen";
import { openExerciseEditor } from "./openExerciseEditor";

const mockApi = { saveExercise: jest.fn<(...args: unknown[]) => Promise<unknown>>() };

jest.mock("../../../lib/api", () => ({ useApi: () => mockApi }));
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
}));
jest.mock("expo-crypto", () => ({ randomUUID: () => "new-id" }));

const checked = (label: string): boolean | undefined =>
  screen.getByRole("radio", { name: label }).props.accessibilityState?.checked;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
});

describe("exercise editor", () => {
  it("makes one in the category it was opened in, on that category's measure, and opens it once saved", async () => {
    mockApi.saveExercise.mockResolvedValue({ exercise: anExercise("new-id", "Dips", "strength") });
    await renderWithHang(<ExerciseEditorScreen kind="strength" />);
    expect(screen.getByText("New exercise")).toBeTruthy();
    expect(screen.getByText("Strength")).toBeTruthy();
    expect(screen.queryByText("Category")).toBeNull();
    expect(screen.queryByRole("radio", { name: "Mobility" })).toBeNull();
    expect(checked("Reps × weight")).toBe(true);
    await fireEvent.changeText(screen.getByLabelText("Name"), " Dips ");
    await fireEvent.press(screen.getByLabelText("Each side"));
    await fireEvent.press(screen.getByText("Save"));
    await act(async () => undefined);
    expect(mockApi.saveExercise).toHaveBeenCalledWith("new-id", {
      name: "Dips",
      kind: "strength",
      measure: "repsWeight",
      eachSide: true,
      builtIn: null,
    });
    expect(router.replace).toHaveBeenCalledWith({
      pathname: "/exercise/[id]",
      params: { id: "new-id" },
    });
  });

  it("measures climbing in climbs or time on the wall, never by side", async () => {
    mockApi.saveExercise.mockResolvedValue({ exercise: anExercise("new-id", "4x4s", "climbing") });
    await renderWithHang(<ExerciseEditorScreen kind="climbing" />);
    expect(screen.getByText("Climbing")).toBeTruthy();
    expect(checked("Climbs")).toBe(true);
    expect(screen.getByRole("radio", { name: "Time on the wall" })).toBeTruthy();
    expect(screen.queryByRole("radio", { name: "Rounds" })).toBeNull();
    expect(screen.queryByLabelText("Each side")).toBeNull();
    await fireEvent.changeText(screen.getByLabelText("Name"), "4x4s");
    await fireEvent.press(screen.getByText("Save"));
    await act(async () => undefined);
    expect(mockApi.saveExercise).toHaveBeenCalledWith("new-id", {
      name: "4x4s",
      kind: "climbing",
      measure: "reps",
      eachSide: false,
      builtIn: null,
    });
  });

  it("makes a grip in Fingers, measured as hangs", async () => {
    const { actions } = await renderWithHang(<ExerciseEditorScreen kind="hangboard" />);
    expect(screen.getByRole("radio", { name: "Hang × weight" })).toBeChecked();
    await fireEvent.changeText(screen.getByLabelText("Name"), "Mono");
    await fireEvent.press(screen.getByText("Save"));
    await act(async () => undefined);
    expect(actions.saveGrip).toHaveBeenCalledWith({
      id: "new-id",
      name: "Mono",
      custom: true,
      hidden: false,
    });
    expect(mockApi.saveExercise).not.toHaveBeenCalled();
    expect(router.back).toHaveBeenCalled();
  });

  it("makes a grip in Fingers measured as a ground pull held for time", async () => {
    const { actions } = await renderWithHang(<ExerciseEditorScreen kind="hangboard" />);
    await fireEvent.changeText(screen.getByLabelText("Name"), "Block");
    await fireEvent.press(screen.getByText("Time × weight"));
    await fireEvent.press(screen.getByText("Save"));
    await act(async () => undefined);
    expect(actions.saveGrip).toHaveBeenCalledWith({
      id: "new-id",
      name: "Block",
      custom: true,
      hidden: false,
      measure: "secondsWeight",
    });
  });

  it("hands what was saved back to the screen that opened it", async () => {
    const onSave = jest.fn();
    openExerciseEditor("mobility", "Pancake", onSave);
    const [[route]] = jest.mocked(router.push).mock.calls as unknown as [
      [{ params: { kind: "mobility"; name: string; ret: string } }],
    ];
    expect(route.params).toMatchObject({ kind: "mobility", name: "Pancake" });
    await renderWithHang(<ExerciseEditorScreen {...route.params} />);
    expect(screen.getByDisplayValue("Pancake")).toBeTruthy();
    await fireEvent.press(screen.getByText("Save"));
    expect(onSave).toHaveBeenCalledWith({
      kind: "mobility",
      name: "Pancake",
      measure: "seconds",
      eachSide: false,
    });
    expect(mockApi.saveExercise).not.toHaveBeenCalled();
    expect(router.back).toHaveBeenCalled();
  });

  it("edits the user's exercise in place, asking before a discard", async () => {
    mockApi.saveExercise.mockResolvedValue({});
    await renderWithHang(<ExerciseEditorScreen kind="strength" id="e1" />, undefined, {
      exercises: [anExercise("e1", "Plank", "strength", { measure: "seconds" })],
    });
    expect(screen.getByText("Edit exercise")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Name"), "Front plank");
    await fireEvent.press(screen.getByText("Cancel"));
    expect(Alert.alert).toHaveBeenCalledWith("Discard your changes?", undefined, expect.anything());
    expect(router.back).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByText("Save"));
    expect(router.back).toHaveBeenCalled();
    expect(mockApi.saveExercise).toHaveBeenCalledWith("e1", {
      name: "Front plank",
      kind: "strength",
      measure: "seconds",
      eachSide: false,
    });
  });
});
