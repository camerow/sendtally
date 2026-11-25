import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClientProvider } from "@tanstack/react-query";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import type { WorkoutRecord } from "@sendtally/api-client";
import { setPlanPath, type Wizard } from "@sendtally/features/settings";
import { ENTITLEMENTS, hangingApi, seededClient } from "../../billing/testBilling";
import { WithHang } from "../../training/data/testHang";
import { BuildWeekStep } from "./BuildWeekStep";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const actions = vi.hoisted(() => ({
  saveBlock: vi.fn(async () => undefined),
  saveMembership: vi.fn(async () => undefined),
  deleteMembership: vi.fn(async () => undefined),
}));

vi.mock("../../training/data/usePlanActions", () => ({ usePlanActions: () => actions }));
vi.mock("../../lib/useAppApi", async () => {
  const { hangingApi: api } = await import("../../billing/testBilling");
  return { useAppApi: () => api };
});

const legs: WorkoutRecord = {
  id: "legs",
  kind: "strength",
  name: "Gym, legs",
  description: "",
  minutes: 50,
  targetRpe: null,
  items: [{ exercise: "Back squat", doses: [{ sets: 5, reps: 5 }] }],
  exerciseRestS: 180,
  focus: null,
  updatedAt: "t",
};

const wizard = {
  path: "plan",
  step: "P1w",
  canGoBack: true,
  position: { n: 1, total: 2 },
  memory: { way: null, existingLog: null },
  choose: vi.fn(),
  answerLog: vi.fn(),
  setWay: vi.fn(),
  open: vi.fn(),
  next: vi.fn(),
  back: vi.fn(),
  skip: vi.fn(),
  leave: vi.fn(),
  complete: vi.fn(),
  capture: vi.fn(),
} satisfies Wizard;

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.clearAllMocks();
  setPlanPath(() => ({ workouts: [], days: {}, members: {}, blockId: null, seeded: false }));
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});

const show = (workouts: WorkoutRecord[] = []): void =>
  act(() =>
    root.render(
      <QueryClientProvider client={seededClient(ENTITLEMENTS.trial, { workouts })}>
        <MemoryRouter>
          <WithHang>
            <BuildWeekStep wizard={wizard} api={hangingApi} />
          </WithHang>
        </MemoryRouter>
      </QueryClientProvider>
    )
  );

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

const button = (label: string): HTMLButtonElement | undefined =>
  [...host.querySelectorAll<HTMLButtonElement>("button")].find(
    (b) => b.getAttribute("aria-label") === label || b.textContent === label
  );
const schedule = (): HTMLButtonElement | undefined =>
  [...host.querySelectorAll("button")].find((b) => b.textContent?.startsWith("Schedule from"));

describe("Build your week", () => {
  it("arrives with Climbing picked, its days open and none set, and Schedule off", () => {
    show();
    expect(button("Take Climbing back out")).toBeDefined();
    for (const name of [
      "Max hangs",
      "5x5 strength",
      "Antagonist push",
      "Core circuit",
      "Hip mobility flow",
    ])
      expect(button(`Add ${name}`)).toBeDefined();
    expect(host.querySelectorAll('[role="checkbox"][aria-label="Monday"]')).toHaveLength(1);
    expect(host.textContent).toContain("Tap the days you climb");
    expect(schedule()?.disabled).toBe(true);
  });

  it("puts a pressed day on the week card and schedules what has a day", () => {
    show();
    act(() => button("Monday")?.click());
    expect(host.querySelectorAll(".dark-week-cell.is-on")).toHaveLength(1);
    expect(host.textContent).toContain("1 session a week");
    act(() => button("Add Max hangs")?.click());
    expect(button("Take Max hangs back out")).toBeDefined();
    act(() => schedule()?.click());
    expect(actions.saveBlock).toHaveBeenCalledWith(
      expect.objectContaining({ name: "October block", start: "2026-10-05" })
    );
    expect(actions.saveMembership).toHaveBeenCalledTimes(1);
    expect(actions.saveMembership).toHaveBeenCalledWith(
      expect.objectContaining({ workoutId: "climb-session", weekdays: [0] })
    );
    expect(wizard.next).toHaveBeenCalledWith({ count: 1, sessions: 1, own: 0 });
  });

  it("opens the builder as a side step", () => {
    show();
    act(() => button("Build my own")?.click());
    expect(wizard.open).toHaveBeenCalledWith("P2");
  });

  it("lists a workout the user built first, wearing the Yours tag", () => {
    setPlanPath(() => ({
      workouts: ["legs", "climb-session"],
      days: {},
      members: {},
      blockId: null,
      seeded: true,
    }));
    show([legs]);
    const first = host.querySelector(".build-week-row");
    expect(first?.querySelector(".category-row-name")?.textContent).toBe("Gym, legs");
    expect(first?.querySelector(".plan-path-yours")?.textContent).toBe("Yours");
    expect(host.querySelectorAll(".plan-path-yours")).toHaveLength(1);
  });
});
