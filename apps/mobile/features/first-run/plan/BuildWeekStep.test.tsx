import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import React from "react";
import type { Plan, SendtallyApi } from "@sendtally/api-client";
import type { Membership } from "@sendtally/core/hang";
import { setPlanPath, type Wizard } from "@sendtally/features/settings";
import { hangData, renderWithHang } from "../../training/data/renderWithHang";
import { BuildWeekStep } from "./BuildWeekStep";

const mockPlan = {
  saveBlock: jest.fn(async () => undefined),
  saveMembership: jest.fn<(m: Membership) => Promise<void>>(async () => undefined),
  deleteMembership: jest.fn(async () => undefined),
};

const mockApi = new Proxy(
  {},
  { get: (_, key) => (key === "then" ? undefined : () => new Promise(() => {})) }
) as SendtallyApi;

let mockIds = 0;
jest.mock("../../../lib/api", () => ({ useApi: () => mockApi }));
jest.mock("../../training/plan/usePlanActions", () => ({ usePlanActions: () => mockPlan }));
jest.mock("expo-router", () => ({ router: { back: jest.fn(), push: jest.fn() } }));
jest.mock("expo-crypto", () => ({ randomUUID: () => `id-${++mockIds}` }));

const plan: Plan = {
  blocks: [],
  memberships: [],
  weekChanges: [],
  planChanges: [],
  membershipDays: [],
};

const wizard = {
  path: "plan",
  step: "P1w",
  canGoBack: true,
  position: { n: 1, total: 2 },
  memory: { way: null, existingLog: null },
  choose: jest.fn(),
  answerLog: jest.fn(),
  setWay: jest.fn(),
  open: jest.fn(),
  next: jest.fn(),
  back: jest.fn(),
  skip: jest.fn(),
  leave: jest.fn(),
  complete: jest.fn(),
  capture: jest.fn(),
} satisfies Wizard;

const schedule = () => screen.getByRole("button", { name: /^Schedule from/ });

beforeEach(() => {
  jest.clearAllMocks();
  mockIds = 0;
  setPlanPath(() => ({ workouts: [], days: {}, members: {}, blockId: null, seeded: false }));
});

describe("Build your week", () => {
  it("arrives with Climbing picked and its days open, none set, and Schedule off", async () => {
    await renderWithHang(<BuildWeekStep wizard={wizard} api={mockApi} />, hangData(), { plan });
    expect(screen.getByText("Tap the days you climb")).toBeTruthy();
    expect(screen.getByLabelText("Take Climbing back out")).toBeTruthy();
    for (const name of [
      "Max hangs",
      "5x5 strength",
      "Antagonist push",
      "Core circuit",
      "Hip mobility flow",
    ])
      expect(screen.getByLabelText(`Add ${name}`)).toBeTruthy();
    const monday = screen.getAllByRole("checkbox", { name: "Monday" });
    expect(monday).toHaveLength(1);
    expect(monday[0]?.props.accessibilityState).toMatchObject({ checked: false });
    expect(screen.getByRole("button", { name: "Build my own" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "All workouts" })).toBeTruthy();
    expect(schedule().props.accessibilityState).toMatchObject({ disabled: true });
  });

  it("puts each pressed day on the week and schedules what has a day, leaving a pick with none out", async () => {
    await renderWithHang(<BuildWeekStep wizard={wizard} api={mockApi} />, hangData(), { plan });
    await fireEvent.press(screen.getByRole("checkbox", { name: "Monday" }));
    await fireEvent.press(screen.getByRole("checkbox", { name: "Friday" }));
    await fireEvent.press(screen.getByLabelText("Add Max hangs"));
    await fireEvent.press(screen.getAllByRole("checkbox", { name: "Wednesday" })[1]!);
    await fireEvent.press(screen.getByLabelText("Add Core circuit"));
    expect(screen.getByText("3 sessions a week")).toBeTruthy();
    expect(screen.getByLabelText("Take Max hangs back out")).toBeTruthy();

    await fireEvent.press(schedule());
    expect(mockPlan.saveBlock).toHaveBeenCalledWith(
      expect.objectContaining({ name: "October block", weeks: 4, start: "2026-10-05" })
    );
    expect(mockPlan.saveMembership.mock.calls.map(([m]) => m)).toEqual([
      expect.objectContaining({ workoutId: "climb-session", weekdays: [0, 4], position: 0 }),
      expect.objectContaining({ workoutId: "max10", weekdays: [2], position: 1 }),
    ]);
    expect(wizard.next).toHaveBeenCalledWith({ count: 2, sessions: 3, own: 0 });
  });

  it("opens the builder as a side step", async () => {
    await renderWithHang(<BuildWeekStep wizard={wizard} api={mockApi} />, hangData(), { plan });
    await fireEvent.press(screen.getByRole("button", { name: "Build my own" }));
    expect(wizard.open).toHaveBeenCalledWith("P2");
  });
});
