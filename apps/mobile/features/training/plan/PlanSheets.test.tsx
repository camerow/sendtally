import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import React from "react";
import type * as ReactNative from "react-native";
import { renderWithHang, TODAY } from "../data/renderWithHang";
import { PlanSheets } from "./PlanSheets";
import type { PlanRequest } from "./types";

jest.mock("../../../components/Sheet", () => {
  const { useEffect } = jest.requireActual<typeof React>("react");
  return {
    Sheet: ({
      visible,
      onClose,
      children,
      footer,
    }: {
      visible: boolean;
      onClose: () => void;
      children: React.ReactNode;
      footer?: React.ReactNode;
    }) => {
      useEffect(() => {
        if (!visible) onClose();
      }, [visible, onClose]);
      return visible ? (
        <>
          {children}
          {footer}
        </>
      ) : null;
    },
  };
});
jest.mock("@gorhom/bottom-sheet", () => ({
  BottomSheetTextInput: jest.requireActual<typeof ReactNative>("react-native").TextInput,
}));
jest.mock("../../../lib/api", () => ({ useApi: () => undefined }));
jest.mock("expo-crypto", () => ({ randomUUID: () => "new-id" }));
const mockSave = jest.fn(() => Promise.resolve());
jest.mock("./usePlanActions", () => ({
  usePlanActions: () => ({ savePlanItem: mockSave, deletePlanItem: jest.fn() }),
}));

function Host(): React.ReactElement {
  const [request, setRequest] = React.useState<PlanRequest | null>({
    mode: "choose",
    days: [1],
    start: TODAY,
  });
  return <PlanSheets request={request} onChange={setRequest} />;
}

describe("Plan training", () => {
  it("hands the pick on to its form and saves a plan item", async () => {
    await renderWithHang(<Host />);
    await fireEvent.press(screen.getByText("Strength"));
    expect(screen.getByDisplayValue("Strength session")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Thursday"));
    await fireEvent.press(screen.getByLabelText("Effort 7 of 10"));
    await fireEvent.press(screen.getByText("Add to plan"));
    expect(mockSave).toHaveBeenCalledWith({
      id: "new-id",
      kind: "strength",
      title: "Strength session",
      days: [1, 3],
      perWeek: null,
      start: TODAY,
      end: null,
      skip: [],
      minutes: null,
      targetRpe: 7,
      projectId: null,
      template: null,
    });
  });

  it("keeps a checklist template, with nothing to tick", async () => {
    await renderWithHang(<Host />);
    await fireEvent.press(screen.getByText("Mobility"));
    await fireEvent.press(screen.getByText("Add checklist"));
    expect(screen.queryByRole("checkbox", { name: "Item" })).toBeNull();
    await fireEvent.changeText(screen.getByPlaceholderText("Deep squat hold"), "Cat-cow");
    await fireEvent.changeText(screen.getByLabelText("Dose"), "× 10");
    await fireEvent.press(screen.getByText("Add to plan"));
    expect(mockSave).toHaveBeenLastCalledWith(
      expect.objectContaining({
        kind: "mobility",
        template: { kind: "checklist", items: [{ text: "Cat-cow", dose: "× 10" }] },
      })
    );
  });

  it("opens the hangboard planner for a hangboard workout", async () => {
    await renderWithHang(<Host />);
    await fireEvent.press(screen.getByText("Hangboard workout"));
    expect(screen.getByText("Pick a workout.")).toBeTruthy();
  });
});
