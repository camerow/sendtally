import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { Alert } from "react-native";
import type { HangSessionRecord } from "@sendtally/api-client";
import { hangData, renderWithHang } from "../data/renderWithHang";
import { HangSessionForm } from "./HangSessionForm";

jest.mock("../../../lib/api", () => ({ useApi: () => undefined }));
jest.mock("../../../components/Sheet", () => ({ Sheet: () => null }));
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
    await fireEvent.press(screen.getByLabelText("Less completion"));
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

  it("deletes it with its summary only once confirmed", async () => {
    const alert = jest.spyOn(Alert, "alert");
    const { actions } = await renderWithHang(
      <HangSessionForm session={session} />,
      hangData({ sessions: [session] })
    );
    await fireEvent.press(screen.getByText("Delete workout"));
    expect(alert.mock.calls[0]?.[0]).toBe("Delete Repeaters 7/3?");
    expect(actions.deleteSession).not.toHaveBeenCalled();
    const buttons = alert.mock.calls[0]?.[2] ?? [];
    await act(async () => buttons.find((b) => b.style === "destructive")?.onPress?.());
    expect(actions.deleteSession).toHaveBeenCalledWith("h1");
    expect(router.dismiss).toHaveBeenCalledWith(2);
    alert.mockRestore();
  });
});
