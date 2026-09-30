import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import React from "react";
import { Alert, type AlertButton } from "react-native";
import type * as ReactNative from "react-native";
import { LIBRARY, type Grip } from "@sendtally/core/hang";
import { hangData, renderWithHang } from "../data/renderWithHang";
import { GripPickerSheet } from "./GripPickerSheet";

jest.mock("../../components/Sheet", () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? children : null,
}));
jest.mock("@gorhom/bottom-sheet", () => ({
  BottomSheetTextInput: jest.requireActual<typeof ReactNative>("react-native").TextInput,
}));
jest.mock("expo-crypto", () => ({ randomUUID: () => "new-grip" }));

const repeaters = LIBRARY[0]!;
const mono: Grip = { id: "g1", name: "Mono", custom: true, hidden: false };
const gone: Grip = { id: "g2", name: "Front 3", custom: true, hidden: true };

const renderPicker = (onPick = jest.fn<(id: string) => void>(), selected = ["half"]) =>
  renderWithHang(
    <GripPickerSheet
      visible
      workout={repeaters}
      multi
      selected={selected}
      onPick={onPick}
      onClose={() => undefined}
    />,
    hangData({ grips: [mono, gone] })
  );

describe("Grip picker", () => {
  it("lists deleted grips no more, and only lets the user's own grips be edited", async () => {
    await renderPicker();
    expect(screen.getByText("Mono")).toBeTruthy();
    expect(screen.queryByText("Front 3")).toBeNull();
    expect(screen.getByLabelText("Edit Mono")).toBeTruthy();
    expect(screen.queryByLabelText("Edit Half crimp")).toBeNull();
  });

  it("renames a grip, refusing a name another grip has", async () => {
    const { actions } = await renderPicker();
    await fireEvent.press(screen.getByLabelText("Edit Mono"));
    await fireEvent.changeText(screen.getByLabelText("Name"), "half CRIMP");
    expect(screen.getByText("You already have a grip called Half crimp.")).toBeTruthy();
    await fireEvent.press(screen.getByText("Save changes"));
    expect(actions.saveGrip).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByLabelText("Name"), " Mono pocket ");
    await fireEvent.press(screen.getByText("Save changes"));
    expect(actions.saveGrip).toHaveBeenCalledWith({ ...mono, name: "Mono pocket" });
  });

  it("deletes a grip after confirming, and drops it from the selection", async () => {
    jest
      .spyOn(Alert, "alert")
      .mockImplementation((_title, _body, buttons?: AlertButton[]) => buttons?.[1]?.onPress?.());
    const onPick = jest.fn<(id: string) => void>();
    const { actions } = await renderPicker(onPick, ["half", "g1"]);
    await fireEvent.press(screen.getByLabelText("Edit Mono"));
    await fireEvent.press(screen.getByText("Delete grip"));
    expect(actions.deleteGrip).toHaveBeenCalledWith("g1");
    expect(onPick).toHaveBeenCalledWith("g1");
  });

  it("brings a deleted grip back when its name is added again", async () => {
    const onPick = jest.fn<(id: string) => void>();
    const { actions } = await renderPicker(onPick);
    await fireEvent.changeText(screen.getByLabelText("New grip name"), "front 3");
    await fireEvent.press(screen.getByText("Add"));
    expect(actions.saveGrip).toHaveBeenCalledWith({ ...gone, hidden: false });
    expect(onPick).toHaveBeenCalledWith("g2");
  });
});
