import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { hangData, renderWithHang } from "../data/renderWithHang";
import { WorkoutDetailScreen } from "./WorkoutDetailScreen";

jest.mock("expo-router", () => ({ router: { push: jest.fn(), back: jest.fn() } }));
jest.mock("../../../lib/api", () => ({ useApi: () => undefined }));
jest.mock("../../../components/Sheet", () => ({ Sheet: () => null }));
jest.mock("expo-crypto", () => ({ randomUUID: () => "copy" }));

const logged = {
  id: "h1",
  workoutId: "fingers-ab",
  gripId: "half",
  date: "2026-09-20",
  edgeMm: 20,
  loadKg: 0,
  pct: 100,
  misses: 0,
  rpe: null,
  membershipId: null,
  week: null,
  focus: null,
  done: [],
  protocol: {
    name: "Fingers A/B",
    kind: "hang" as const,
    hangS: 10,
    restS: 0,
    reps: 1,
    sets: 6,
    setRestS: 180,
  },
  stravaActivityId: null,
  postState: null,
  postError: null,
  updatedAt: "t",
};

describe("Hangboard workout detail", () => {
  it("shows the first dose before any session", async () => {
    await renderWithHang(<WorkoutDetailScreen id="fingers-ab" />);
    expect(screen.getByText("6 × 1")).toBeTruthy();
  });

  it("shows the dose the next session takes, as Start runs it", async () => {
    await renderWithHang(<WorkoutDetailScreen id="fingers-ab" />, hangData({ sessions: [logged] }));
    expect(screen.getByText("3 × 6")).toBeTruthy();
    expect(screen.queryByText("6 × 1")).toBeNull();
  });

  it("links to its grip's progress once the grip has a session", async () => {
    await renderWithHang(<WorkoutDetailScreen id="fingers-ab" />);
    expect(screen.queryByText("Half crimp progress")).toBeNull();
    await renderWithHang(<WorkoutDetailScreen id="fingers-ab" />, hangData({ sessions: [logged] }));
    await fireEvent.press(screen.getByText("Half crimp progress"));
    expect(router.push).toHaveBeenCalledWith({ pathname: "/grip/[id]", params: { id: "half" } });
  });
});
