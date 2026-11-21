import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import type { HangSessionRecord } from "@sendtally/api-client";
import { hangData, renderWithHang } from "../data/renderWithHang";
import { HangSessionForm } from "./HangSessionForm";

jest.mock("../../../lib/api", () => ({ useApi: () => undefined }));
jest.mock("../../../components/Sheet", () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? children : null,
}));
jest.mock("expo-router", () => ({
  router: { canGoBack: () => true, back: jest.fn(), dismiss: jest.fn() },
}));

const session: HangSessionRecord = {
  id: "h1",
  workoutId: "repeaters",
  gripId: "half-crimp",
  date: "2026-09-28",
  edgeMm: 20,
  loadKg: 10,
  pct: 100,
  misses: 0,
  rpe: 7,
  protocol: {
    name: "Repeaters 7/3",
    kind: "hang",
    hangS: 7,
    restS: 3,
    reps: 6,
    sets: 3,
    setRestS: 180,
  },
  membershipId: null,
  week: null,
  focus: null,
  done: [],
  stravaActivityId: "9",
  postState: "posted",
  postError: null,
  updatedAt: "t",
};

describe("Editing a hangboard session", () => {
  it("saves each set's hangs and load, and the share held, without its Strava fields", async () => {
    const { actions } = await renderWithHang(
      <HangSessionForm session={session} />,
      hangData({ sessions: [session] })
    );
    expect(screen.getByText("Edit workout")).toBeTruthy();
    expect(screen.getByText("18 of 18 hangs · top load +10 kg")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("half-crimp, set 2 · Hangs"));
    await fireEvent.press(screen.getByLabelText("5"));
    await fireEvent.press(screen.getByLabelText("Done"));
    await fireEvent.press(screen.getByLabelText("half-crimp, set 3 · Load"));
    await fireEvent.press(screen.getByLabelText("1"));
    await fireEvent.press(screen.getByLabelText("5"));
    await fireEvent.press(screen.getByLabelText("Done"));
    expect(screen.getByText("17 of 18 hangs · top load +15 kg")).toBeTruthy();
    await fireEvent.press(screen.getByText("Save"));
    const {
      stravaActivityId: _s,
      postState: _p,
      postError: _e,
      updatedAt: _u,
      ...fields
    } = session;
    const set = (reps: number, weightKg: number): object => ({ reps, edgeMm: 20, weightKg });
    expect(actions.saveSession).toHaveBeenCalledWith({
      ...fields,
      pct: 94,
      misses: 1,
      done: [{ item: 0, exercise: "half-crimp", sets: [set(6, 10), set(5, 10), set(6, 15)] }],
    });
    expect(router.back).toHaveBeenCalled();
  });

  it("shows and saves every grip of a session that ran several", async () => {
    const sets = (edgeMm: number, weightKg: number): object[] =>
      Array.from({ length: 3 }, () => ({ reps: 6, onS: 7, offS: 3, edgeMm, weightKg }));
    const three: HangSessionRecord = {
      ...session,
      done: [
        { item: 0, exercise: "half-crimp", sets: sets(20, 10) },
        { item: 1, exercise: "open-hand", sets: sets(18, 5) },
        { item: 2, exercise: "pinch", sets: sets(0, 0) },
      ] as HangSessionRecord["done"],
    };
    const { actions } = await renderWithHang(
      <HangSessionForm session={three} />,
      hangData({ sessions: [three] })
    );
    await fireEvent.press(screen.getByLabelText("open-hand, set 2 · Hangs"));
    await fireEvent.press(screen.getByLabelText("4"));
    await fireEvent.press(screen.getByLabelText("Done"));
    expect(screen.getByText("52 of 54 hangs · top load +10 kg")).toBeTruthy();
    await fireEvent.press(screen.getByText("Save"));
    const saved = jest.mocked(actions.saveSession).mock.calls[0]?.[0];
    expect(saved?.done.map((d) => [d.exercise, d.sets.map((s) => s.reps)])).toEqual([
      ["half-crimp", [6, 6, 6]],
      ["open-hand", [6, 4, 6]],
      ["pinch", [6, 6, 6]],
    ]);
    expect(saved?.done[1]?.sets[1]).toMatchObject({ edgeMm: 18, weightKg: 5 });
    expect(saved?.misses).toBe(2);
  });

  it("edits without a Delete: that lives in the summary's menu", async () => {
    await renderWithHang(<HangSessionForm session={session} />, hangData({ sessions: [session] }));
    expect(screen.queryByText("Delete workout")).toBeNull();
  });
});
