import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { startRun } from "@sendtally/core/hang";
import { useLiveSession } from "@sendtally/features/log-session";
import { liveRunStorage } from "../../lib/liveRunStorage";
import { writeLiveRun } from "./liveRun";
import { LiveLink } from "./LiveLink";

jest.mock("expo-router", () => ({ router: { dismissTo: jest.fn() } }));
jest.mock("../../lib/liveRunStorage");
jest.mock("../../lib/liveSessionStorage", () => ({ liveSessionStorage: {} }));
jest.mock("@sendtally/features/log-session", () => ({
  ...jest.requireActual<object>("@sendtally/features/log-session"),
  useLiveSession: jest.fn(),
}));

const session = (draft: object | undefined): void => {
  jest
    .mocked(useLiveSession)
    .mockReturnValue({ stored: draft === undefined ? null : { draft } } as unknown as ReturnType<
      typeof useLiveSession
    >);
};

describe("the system timer's link", () => {
  beforeEach(() => {
    liveRunStorage.remove();
    jest.mocked(router.dismissTo).mockClear();
    session(undefined);
  });

  it("opens the running timer", async () => {
    writeLiveRun({
      title: "Repeaters",
      workoutId: "w1",
      pathname: "/workout/timer",
      params: { workoutId: "w1" },
      startedAt: 0,
      state: {
        player: "timer",
        run: startRun(
          { name: "R", kind: "hang", hangS: 7, restS: 3, reps: 6, sets: 6, setRestS: 180 },
          0
        ),
      },
    });
    await render(<LiveLink />);
    expect(router.dismissTo).toHaveBeenCalledWith({
      pathname: "/workout/timer",
      params: { workoutId: "w1" },
    });
  });

  it("opens the live climbing session", async () => {
    session({ climbs: [] });
    await render(<LiveLink />);
    expect(router.dismissTo).toHaveBeenCalledWith("/session/live");
  });

  it("goes home when nothing is live", async () => {
    await render(<LiveLink />);
    expect(router.dismissTo).toHaveBeenCalledWith("/(tabs)/today");
  });
});
