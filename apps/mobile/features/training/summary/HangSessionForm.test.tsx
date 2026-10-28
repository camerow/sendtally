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
jest.mock("expo-router", () => ({ router: { back: jest.fn(), dismiss: jest.fn() } }));

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
  it("saves what changed from the header, without its Strava fields", async () => {
    const { actions } = await renderWithHang(
      <HangSessionForm session={session} />,
      hangData({ sessions: [session] })
    );
    expect(screen.getByText("Edit workout")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Completion"));
    await fireEvent.press(screen.getByLabelText("Subtract 5"));
    await fireEvent.press(screen.getByLabelText("Done"));
    await fireEvent.press(screen.getByText("Save"));
    const {
      stravaActivityId: _s,
      postState: _p,
      postError: _e,
      updatedAt: _u,
      ...fields
    } = session;
    expect(actions.saveSession).toHaveBeenCalledWith({ ...fields, pct: 95 });
    expect(router.back).toHaveBeenCalled();
  });

  it("edits without a Delete: that lives in the summary's menu", async () => {
    await renderWithHang(<HangSessionForm session={session} />, hangData({ sessions: [session] }));
    expect(screen.queryByText("Delete workout")).toBeNull();
  });
});
