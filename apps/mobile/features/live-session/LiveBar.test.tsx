import { describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import React from "react";
import type { LiveRun } from "@sendtally/features/workouts";
import { LiveBar } from "./LiveBar";

const mockRun: LiveRun = {
  title: "Hip mobility flow",
  workoutId: "w1",
  pathname: "/workout/sets",
  params: {},
  startedAt: 0,
  state: {
    player: "sets",
    done: [{ item: 0, exercise: "Couch stretch, each side", sets: [{ onS: 60 }] }],
    ticked: [],
  },
};

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("../../lib/api", () => ({ useApi: () => undefined }));
jest.mock("../../lib/liveSessionStorage", () => ({ liveSessionStorage: {} }));
jest.mock("@sendtally/features/gyms", () => ({
  useGyms: () => ({ gyms: [] }),
  gymOfDraft: () => null,
}));
jest.mock("@sendtally/features/log-session", () => ({
  ...jest.requireActual<object>("@sendtally/features/log-session"),
  useLiveSession: () => ({ stored: null }),
}));
jest.mock("./liveRun", () => ({
  useLiveRun: () => mockRun,
  liveRunHref: () => "/workout/sets",
}));

describe("the live bar", () => {
  it("shortens an exercise's name on its own line and keeps its set whole", async () => {
    await render(<LiveBar />);
    const name = screen.getByText("Couch stretch, each side");
    const set = screen.getByText(" · Set 1 of 1");
    expect(name.props.numberOfLines).toBe(1);
    expect(name.props.style).toContainEqual({ flexShrink: 1 });
    expect(set.props.style).toContainEqual({ flexShrink: 0 });
  });
});
