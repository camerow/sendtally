import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import type { Schedule } from "@sendtally/core/hang";
import { hangData, renderWithHang } from "../data/renderWithHang";
import { TodayScreen } from "./TodayScreen";

jest.mock("../../../components/Sheet", () => ({ Sheet: () => null }));
jest.mock("../../../lib/api", () => ({ useApi: () => undefined }));
jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  useNavigation: () => ({ addListener: () => () => undefined }),
}));
jest.mock("@sendtally/features/query", () => ({
  ...jest.requireActual<object>("@sendtally/features/query"),
  useQuery: () => ({
    state: { status: "ready", data: { sessions: [], hangSessions: [] } },
    refreshFailed: false,
    reload: () => Promise.resolve(),
  }),
}));

const schedule: Schedule = {
  id: "s1",
  workoutId: "max10",
  gripId: "half",
  days: [0, 1],
  start: "2026-09-28",
  end: null,
  skip: [],
};

describe("Today", () => {
  it("starts today's planned workout on its grip", async () => {
    await renderWithHang(<TodayScreen />, hangData({ schedules: [schedule] }));
    expect(screen.getByText("Up today · Hangboard")).toBeTruthy();
    await fireEvent.press(screen.getByText("Start"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/workout/timer",
      params: { workoutId: "max10", gripId: "half" },
    });
  });

  it("shows a past planned day as missed and skips just that date", async () => {
    const { actions } = await renderWithHang(<TodayScreen />, hangData({ schedules: [schedule] }));
    await fireEvent.press(screen.getByLabelText(/^Monday.*0 logged, 1 planned$/));
    expect(screen.getByText("Missed")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText(/^Skip Max hangs/));
    expect(actions.saveSchedules).toHaveBeenCalledWith([{ ...schedule, skip: ["2026-09-28"] }]);
  });

  it("counts the week as done of planned", async () => {
    await renderWithHang(<TodayScreen />, hangData({ schedules: [schedule] }));
    expect(screen.getByText("0 of 2")).toBeTruthy();
  });
});
