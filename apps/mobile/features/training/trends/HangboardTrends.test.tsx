import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import React from "react";
import type { HangSessionRecord } from "@sendtally/api-client";
import { LIBRARY, protocolOf } from "@sendtally/core/hang";
import { hangData, renderWithHang } from "../data/renderWithHang";
import { HangboardTrends } from "./HangboardTrends";

jest.mock("../../../lib/api", () => ({ useApi: () => undefined }));

const session = (
  id: string,
  workoutId: string,
  date: string,
  loadKg: number,
  pct: number
): HangSessionRecord => ({
  id,
  workoutId,
  gripId: "half",
  date,
  loadKg,
  pct,
  misses: 0,
  rpe: 7,
  protocol: protocolOf(LIBRARY.find((w) => w.id === workoutId)!),
  stravaActivityId: null,
  postState: null,
  postError: null,
  updatedAt: "2026-09-28T12:00:00Z",
});

const sessions = [
  session("a", "rep73", "2026-09-01", 2, 100),
  session("b", "rep73", "2026-09-15", 4, 100),
  session("c", "rep73", "2026-09-28", 6, 50),
  session("d", "max10", "2026-09-20", 10, 100),
];

describe("Hangboard trends", () => {
  it("opens on the asked workout, counts only complete sessions, and names the top attempt", async () => {
    await renderWithHang(
      <HangboardTrends workoutId="rep73" gripId="half" />,
      hangData({ sessions })
    );
    expect(screen.getByText(/Repeaters 7:3 on half crimp is up 2 kg over 4 weeks/)).toBeTruthy();
    expect(screen.getByText(/Your top attempt is \+6 kg/)).toBeTruthy();
  });

  it("switches workout from its chip", async () => {
    await renderWithHang(<HangboardTrends workoutId="rep73" />, hangData({ sessions }));
    await fireEvent.press(screen.getByText("Max hangs"));
    expect(screen.getByText(/Completed load has held at \+10 kg/)).toBeTruthy();
  });
});
