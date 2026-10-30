import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { Text as MockText } from "react-native";
import type * as LogSession from "@sendtally/features/log-session";
import { statsSegmentStorage } from "../../lib/statsSegmentStorage";
import { StatsScreen } from "./StatsScreen";

const mockToday = `${new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 10)}T00:00:00.000Z`;

const mockClimb = (vGrade: number, kind: "send" | "attempt"): object => ({
  time: mockToday,
  name: "",
  vGrade,
  kind,
  tries: 1,
  style: "redpoint",
  angle: null,
  note: null,
  link: null,
  grade: { scale: "v", value: vGrade },
});

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("../../lib/api", () => ({ useApi: () => undefined }));
jest.mock("../billing/useBilling", () => ({ useCanSeeInsights: () => true }));
jest.mock("../../lib/statsSegmentStorage", () => {
  let value: string | null = null;
  return {
    statsSegmentStorage: jest
      .requireActual<typeof LogSession>("@sendtally/features/log-session")
      .draftStorage({
        read: () => value,
        write: (next) => {
          value = next;
        },
        remove: () => {
          value = null;
        },
      }),
  };
});
jest.mock("@sendtally/features/settings", () => ({
  useGradeScalePrefs: () => ({ scales: { boulder: "font", route: "yds" }, ready: true }),
}));
jest.mock("@sendtally/features/climbs", () => ({
  ...jest.requireActual<object>("@sendtally/features/climbs"),
  useClimbs: () => ({
    state: {
      status: "ready",
      data: {
        sessions: [
          {
            fingerprint: "s1",
            start_at: mockToday,
            location: "outdoor",
            climbs: [
              mockClimb(4, "send"),
              mockClimb(6, "send"),
              mockClimb(7, "send"),
              mockClimb(8, "attempt"),
            ],
          },
        ],
        activities: [],
        climbs: [],
      },
    },
  }),
}));
jest.mock("../training/data/HangDataProvider", () => ({
  HangDataProvider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("../training/insights/TrainingInsights", () => ({
  TrainingInsights: ({ range }: { range: string }) => <MockText>Training over {range}</MockText>,
}));

describe("Stats", () => {
  beforeEach(() => statsSegmentStorage.remove());

  it("opens on Climbing: the pyramid, then the average send in the climber's scale, then the days", async () => {
    await render(<StatsScreen />);
    expect(screen.getByText("Sends by grade")).toBeTruthy();
    expect(screen.getByLabelText("6C avg send")).toBeTruthy();
    expect(screen.getByLabelText("3 sends")).toBeTruthy();
    expect(screen.queryByText(/days? outside/)).toBeNull();
    expect(
      screen.getByLabelText("Days climbing, Last 7 days: 1 outside, 0 in the gym.")
    ).toBeTruthy();
  });

  it("keeps the range across segments and remembers the segment on the device", async () => {
    await render(<StatsScreen />);
    await fireEvent.press(screen.getByLabelText("3M"));
    await fireEvent.press(screen.getByText("Training"));
    expect(screen.getByText("Training over 3m")).toBeTruthy();
    expect(screen.queryByText("Sends by grade")).toBeNull();
    expect(statsSegmentStorage.read()).toBe("training");
  });

  it("opens on the segment last shown", async () => {
    statsSegmentStorage.write("training");
    await render(<StatsScreen />);
    expect(screen.getByText("Training over 7d")).toBeTruthy();
  });
});
