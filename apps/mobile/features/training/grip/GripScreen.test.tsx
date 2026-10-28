import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { aHang, hangData, renderWithHang } from "../data/renderWithHang";
import { GripScreen } from "./GripScreen";

jest.mock("expo-router", () => ({ router: { push: jest.fn(), back: jest.fn() } }));

const sessions = [
  aHang({ date: "2026-09-01", loadKg: 2 }),
  aHang({ date: "2026-09-08", loadKg: 6, workoutId: "other" }),
  aHang({ date: "2026-09-15", loadKg: 9, pct: 75 }),
  aHang({ date: "2026-09-22", loadKg: 6 }),
  aHang({ date: "2026-09-10", loadKg: -4, edgeMm: 15 }),
  aHang({ date: "2026-09-12", loadKg: 20, gripId: "open" }),
];

describe("GripScreen", () => {
  it("shows the grip across workouts on its most used setup", async () => {
    await renderWithHang(<GripScreen id="half" />, hangData({ sessions }));
    expect(screen.getByText("Hangboard · grip")).toBeTruthy();
    expect(screen.getByText("Half crimp")).toBeTruthy();
    expect(screen.getAllByText("20\u00A0mm · 10s").length).toBeGreaterThan(1);
    expect(screen.getByText("Best · Sep 8")).toBeTruthy();
    expect(screen.getByText("Top attempt · 75%")).toBeTruthy();
    expect(screen.getByText("Reached +5 kg")).toBeTruthy();
    expect(screen.getByText("First session on this grip")).toBeTruthy();
    expect(screen.getByText("History · 4 sessions")).toBeTruthy();
    expect(screen.getByText(/is up 4 kg/)).toBeTruthy();
    expect(screen.getByText("Added load · completed")).toBeTruthy();
    expect(screen.getByText("▲ 4 kg")).toBeTruthy();
  });

  it("leads with the latest attempt before any session is complete", async () => {
    const partials = [
      aHang({ date: "2026-09-01", loadKg: 4, pct: 50 }),
      aHang({ date: "2026-09-08", loadKg: 0, pct: 80 }),
    ];
    await renderWithHang(<GripScreen id="half" />, hangData({ sessions: partials }));
    expect(screen.getByText("Latest attempt")).toBeTruthy();
    expect(screen.queryByText("Added load · completed")).toBeNull();
    expect(screen.getAllByText("Bodyweight").length).toBeGreaterThan(0);
    expect(screen.getByText("Best")).toBeTruthy();
    expect(screen.getAllByText("–")).toHaveLength(2);
    expect(
      screen.getByText(
        "No completed session yet. Finish every set at Bodyweight to set your first best."
      )
    ).toBeTruthy();
    expect(screen.queryByText(/▲|▼/)).toBeNull();
  });

  it("shows no change and no held insight on a single completed session", async () => {
    await renderWithHang(
      <GripScreen id="half" />,
      hangData({ sessions: [aHang({ date: "2026-09-01", loadKg: 4 })] })
    );
    expect(screen.getByText("Best · Sep 1")).toBeTruthy();
    expect(screen.queryByText(/▲|▼/)).toBeNull();
    expect(screen.queryByText(/has held/)).toBeNull();
  });

  it("says a completed load has held once two sessions sat on it", async () => {
    const held = [
      aHang({ date: "2026-09-01", loadKg: 4 }),
      aHang({ date: "2026-09-08", loadKg: 4 }),
    ];
    await renderWithHang(<GripScreen id="half" />, hangData({ sessions: held }));
    expect(screen.getByText(/Completed load has held at \+4 kg/)).toBeTruthy();
    expect(screen.queryByText(/▲|▼/)).toBeNull();
  });

  it("plots every setup under All, labelled mixed, with no insight", async () => {
    await renderWithHang(<GripScreen id="half" />, hangData({ sessions }));
    await fireEvent.press(screen.getByText("All"));
    expect(screen.getByText("Mixed setups")).toBeTruthy();
    expect(screen.getByText("History · 5 sessions")).toBeTruthy();
    expect(screen.queryByText(/is up/)).toBeNull();
  });

  it("tags a best and opens its session", async () => {
    await renderWithHang(<GripScreen id="half" />, hangData({ sessions }));
    const best = screen.getByLabelText(/^\+6 kg, Sep 8 .*, Best$/);
    await fireEvent.press(best);
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/activity/[id]",
      params: { id: "h-half-2026-09-08" },
    });
  });

  it("says there is nothing yet on a grip never hung", async () => {
    await renderWithHang(<GripScreen id="pinch" />, hangData({ sessions }));
    expect(screen.getByText(/Nothing to chart yet/)).toBeTruthy();
  });
});
