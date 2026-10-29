import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import React from "react";
import { router } from "expo-router";
import type { HangSessionRecord } from "@sendtally/api-client";
import { NEW_WORKOUT, type Grip } from "@sendtally/core/hang";
import { aHang, hangData, renderWithHang } from "../data/renderWithHang";
import { GripPickerSheet } from "./GripPickerSheet";

jest.mock("../../../components/Sheet", () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? children : null,
}));
jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("expo-crypto", () => ({ randomUUID: () => "new-grip" }));

const repeaters = {
  ...NEW_WORKOUT,
  id: "rep73",
  source: "library" as const,
  name: "Repeaters 7:3",
};
const mono: Grip = { id: "g1", name: "Mono", custom: true, hidden: false };
const gone: Grip = { id: "g2", name: "Front 3", custom: true, hidden: true };

const renderPicker = (
  onPick = jest.fn<(id: string) => void>(),
  selected = ["half"],
  sessions: HangSessionRecord[] = [],
  onClose = jest.fn()
) =>
  renderWithHang(
    <GripPickerSheet
      visible
      workout={repeaters}
      multi
      selected={selected}
      onPick={onPick}
      onClose={onClose}
    />,
    hangData({ grips: [mono, gone], sessions })
  );

describe("Grip picker", () => {
  it("lists archived exercises no more, each with its best and last day or not done yet", async () => {
    await renderPicker(jest.fn(), ["half"], [aHang({ gripId: "g1", loadKg: 5 })]);
    expect(screen.getByText("Mono")).toBeTruthy();
    expect(screen.queryByText("Front 3")).toBeNull();
    expect(screen.getByText(/Best \+5\skg · 20\smm · Sep 20/)).toBeTruthy();
    expect(screen.getAllByText("Not done yet").length).toBeGreaterThan(0);
  });

  it("opens the exercise editor from the pencil on any exercise, built-ins too", async () => {
    const onClose = jest.fn();
    await renderPicker(jest.fn(), ["half"], [], onClose);
    await fireEvent.press(screen.getByLabelText("Edit Half crimp"));
    expect(onClose).toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/exercise/edit",
      params: { kind: "hangboard", id: "half" },
    });
    await fireEvent.press(screen.getByLabelText("Edit Mono"));
    expect(router.push).toHaveBeenLastCalledWith({
      pathname: "/exercise/edit",
      params: { kind: "hangboard", id: "g1" },
    });
  });

  it("brings a deleted grip back when its name is added again", async () => {
    const onPick = jest.fn<(id: string) => void>();
    const { actions } = await renderPicker(onPick);
    await fireEvent.changeText(screen.getByLabelText("New exercise name"), "front 3");
    await fireEvent.press(screen.getByText("Add"));
    expect(actions.saveGrip).toHaveBeenCalledWith({ ...gone, hidden: false });
    expect(onPick).toHaveBeenCalledWith("g2");
  });
});
