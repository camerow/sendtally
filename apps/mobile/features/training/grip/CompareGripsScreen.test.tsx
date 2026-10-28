import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { aHang, hangData, renderWithHang } from "../data/renderWithHang";
import { CompareGripsScreen } from "./CompareGripsScreen";

jest.mock("expo-router", () => ({ router: { push: jest.fn(), back: jest.fn() } }));

const pull = aHang({}).protocol;
const sessions = [
  aHang({ date: "2026-09-01", loadKg: 2 }),
  aHang({ date: "2026-09-08", loadKg: 6 }),
  aHang({ date: "2026-09-02", loadKg: 10, gripId: "open" }),
  aHang({ date: "2026-09-03", loadKg: 4, gripId: "pinch", edgeMm: 15 }),
  aHang({
    date: "2026-09-04",
    loadKg: 40,
    gripId: "drag",
    edgeMm: 0,
    protocol: { ...pull, kind: "pull", hangS: 0, reps: 5 },
  }),
];

describe("CompareGripsScreen", () => {
  it("ranks the grips on the most used setup by best completed load", async () => {
    await renderWithHang(<CompareGripsScreen />, hangData({ sessions }));
    expect(screen.getByText("Compare grips")).toBeTruthy();
    expect(screen.getByLabelText("Open hand, +10 kg, Same")).toBeTruthy();
    expect(screen.getByLabelText("Half crimp, +6 kg, +4 kg")).toBeTruthy();
    expect(screen.queryByLabelText(/^Pinch/)).toBeNull();
    expect(screen.queryByLabelText(/^3-finger drag/)).toBeNull();
  });

  it("compares ground pulls only with each other, and opens a grip", async () => {
    await renderWithHang(<CompareGripsScreen />, hangData({ sessions }));
    await fireEvent.press(screen.getByText("Ground pull"));
    expect(screen.queryByLabelText(/^Half crimp/)).toBeNull();
    await fireEvent.press(screen.getByLabelText(/^3-finger drag, 40 kg/));
    expect(router.push).toHaveBeenCalledWith({ pathname: "/grip/[id]", params: { id: "drag" } });
  });
});
