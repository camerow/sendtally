import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { anExercise, renderWithHang } from "../data/renderWithHang";
import { NewExerciseSheet } from "./NewExerciseSheet";

const mockApi = { saveExercise: jest.fn<(...args: unknown[]) => Promise<unknown>>() };

jest.mock("../../../lib/api", () => ({ useApi: () => mockApi }));
jest.mock("../../../components/Sheet", () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? children : null,
}));
jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("expo-crypto", () => ({ randomUUID: () => "new-id" }));

const checked = (label: string): boolean | undefined =>
  screen.getByRole("radio", { name: label }).props.accessibilityState?.checked;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("new exercise", () => {
  it("starts on its category's measure, follows the category until one is picked, and opens once saved", async () => {
    mockApi.saveExercise.mockResolvedValue({ exercise: anExercise("new-id", "Dips", "strength") });
    await renderWithHang(<NewExerciseSheet kind="mobility" onClose={jest.fn()} />);
    expect(checked("Mobility")).toBe(true);
    expect(checked("Seconds")).toBe(true);
    await fireEvent.press(screen.getByRole("radio", { name: "Strength" }));
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
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/exercise/[id]",
      params: { id: "new-id" },
    });
  });

  it("makes a grip in Fingers, measured as hangs", async () => {
    const { actions } = await renderWithHang(
      <NewExerciseSheet kind="hangboard" onClose={jest.fn()} />
    );
    expect(screen.getByText("Hang time × added weight, on an edge")).toBeTruthy();
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
  });
});
