import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import type { Plan } from "@sendtally/api-client";
import { hangData, renderWithHang } from "../data/renderWithHang";
import { CalendarScreen } from "./CalendarScreen";

jest.mock("expo-router", () => ({ router: { push: jest.fn(), back: jest.fn() } }));

// Fingers on Mondays and Tuesdays in a four week block; today is Tuesday Sep 29tember.
const plan: Plan = {
  blocks: [{ id: "b1", name: "Autumn power", start: "2026-09-28", weeks: 4 }],
  memberships: [
    { id: "m1", workoutId: "max10", blockId: "b1", weekdays: [0, 1], start: "2026-09-28" },
  ],
  weekChanges: [],
};

describe("Calendar", () => {
  it("draws the month with the block as a band and a mark per planned day", async () => {
    await renderWithHang(<CalendarScreen />, hangData(), { plan });
    expect(screen.getByText("September 2026")).toBeTruthy();
    expect(screen.getByText("Autumn power · 1/4")).toBeTruthy();
    expect(screen.getByLabelText("Monday Sep 28: 1 planned")).toBeTruthy();
    expect(screen.getByLabelText("Wednesday Sep 30: 0 planned")).toBeTruthy();
  });

  it("opens a day", async () => {
    await renderWithHang(<CalendarScreen />, hangData(), { plan });
    await fireEvent.press(screen.getByLabelText("Tuesday Sep 29: 1 planned"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/plan/day",
      params: { date: "2026-09-29" },
    });
  });

  it("pages by month and back to today", async () => {
    await renderWithHang(<CalendarScreen />, hangData(), { plan });
    await fireEvent.press(screen.getByLabelText("Next month"));
    expect(screen.getByText("October 2026")).toBeTruthy();
    expect(screen.getByText("Autumn power · 4/4")).toBeTruthy();
    await fireEvent.press(screen.getByText("Today"));
    expect(screen.getByText("September 2026")).toBeTruthy();
  });

  it("opens a tapped day, and makes no block from the calendar", async () => {
    await renderWithHang(<CalendarScreen />, hangData(), { plan });
    expect(screen.queryByText("New block")).toBeNull();
    await fireEvent.press(screen.getByLabelText("Thursday Sep 17: 0 planned"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/plan/day",
      params: { date: "2026-09-17" },
    });
  });
});
