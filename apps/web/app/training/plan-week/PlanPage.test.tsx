import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import type { Plan, WorkoutRecord } from "@sendtally/api-client";
import { libraryOf, type WorkoutLibrary } from "@sendtally/features/workouts";
import { ToastProvider } from "../../components/Toast";
import { PlanPage } from "./PlanPage";

import { hangModel } from "@sendtally/features/hang";
import type * as T_settings from "@sendtally/features/settings";
import type * as T_training from "@sendtally/features/training";
import type * as T_useLibrary from "../library/useLibrary";
import { hangData } from "../data/testHang";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute("open", "");
};

const TODAY = "2026-11-12";

const legs: WorkoutRecord = {
  id: "legs",
  kind: "strength",
  name: "Gym, legs",
  description: "",
  minutes: 50,
  targetRpe: null,
  items: [{ exercise: "Back squat", doses: [{ sets: 5, reps: 5 }] }],
  exerciseRestS: 180,
  focus: "strength",
  updatedAt: "t",
};

const one = (id: string, start: string) => ({
  id,
  workoutId: "legs",
  blockId: null,
  weekdays: [],
  start,
  position: 0,
});

const state = vi.hoisted(() => ({
  plan: null as unknown as Plan,
  deleteMembership: vi.fn(async () => undefined),
  saveMembership: vi.fn(async () => undefined),
}));

const library = (): WorkoutLibrary => {
  const workouts = libraryOf([legs]);
  return { workouts, usage: new Map(), workout: (id) => workouts.find((w) => w.id === id) };
};

vi.mock("../library/useLibrary", async (actual) => ({
  ...(await actual<typeof T_useLibrary>()),
  useLibrary: () => ({ state: { status: "ready", data: library() }, reload: vi.fn() }),
}));
vi.mock("../../lib/useAppApi", () => ({ useAppApi: () => ({}) }));
vi.mock("../../components/AccountButton", () => ({ AccountButton: () => null }));
vi.mock("../data/HangDataContext", () => ({
  useHangData: () => ({
    model: hangModel(hangData(), libraryOf([])),
    today: TODAY,
  }),
}));
vi.mock("@sendtally/features/settings", async (actual) => ({
  ...(await actual<typeof T_settings>()),
  useDisplayScales: () => ({ boulder: "v", route: "yds" }),
}));
vi.mock("@sendtally/features/training", async (actual) => {
  const real = await actual<typeof T_training>();
  return {
    ...real,
    useTrainingLog: () => ({
      log: {
        climbs: [],
        hangs: [],
        activities: [],
        plan: state.plan,
        workout: (id: string) => libraryOf([legs]).find((w) => w.id === id),
      },
    }),
    usePlanActions: () => state,
    usePlan: () => ({ state: { status: "ready", data: state.plan }, reload: vi.fn() }),
    useAddTo: () => ({
      add: state.saveMembership,
      undo: state.deleteMembership,
      plans: state.plan.memberships.filter((m) => m.start === TODAY),
    }),
  };
});

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  state.plan = {
    blocks: [],
    memberships: [one("today", TODAY), one("missed", "2026-11-11")],
    weekChanges: [],
    planChanges: [],
    membershipDays: [],
  };
  window.matchMedia = vi.fn(() => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  globalThis.ResizeObserver = class {
    observe(): void {}
    disconnect(): void {}
    unobserve(): void {}
  };
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <MemoryRouter initialEntries={["/app/plan"]}>
        <ToastProvider>
          <PlanPage />
        </ToastProvider>
      </MemoryRouter>
    )
  );
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const menuOf = (scope: Element): string[] => {
  act(() => scope.querySelector<HTMLButtonElement>(".more-button")?.click());
  return Array.from(document.querySelectorAll('[role="menuitem"]')).map((m) => m.textContent ?? "");
};

describe("PlanPage", () => {
  it("shows today's workout as a card with Log it, and its ··· with Remove for a one-off", () => {
    const card = container.querySelector(".plan-card")!;
    expect(card.querySelector(".plan-card-title")?.textContent).toBe("Gym, legs");
    expect(card.querySelector(".plan-card-log")?.getAttribute("href")).toContain(
      "/app/activity/new"
    );
    expect(menuOf(card)).toEqual(["Reschedule", "Skip", "Remove"]);
  });

  it("leads a missed workout's ··· with Log it", () => {
    const row = container.querySelector(".plan-row")!;
    expect(row.querySelector(".kind-circle-badge--missed")).not.toBeNull();
    expect(menuOf(row)[0]).toBe("Log it");
  });

  it("opens Skip with its reasons, and Remove takes the one-off out", () => {
    const card = container.querySelector(".plan-card")!;
    menuOf(card);
    act(() =>
      Array.from(document.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'))
        .find((m) => m.textContent === "Skip")
        ?.click()
    );
    expect(document.querySelector("dialog .sheet-title")?.textContent).toBe("Skip it?");
    act(() => document.querySelector<HTMLButtonElement>("dialog .sheet-cancel")?.click());
    menuOf(card);
    act(() =>
      Array.from(document.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'))
        .find((m) => m.textContent === "Remove")
        ?.click()
    );
    expect(state.deleteMembership).toHaveBeenCalledWith("today");
  });

  it("schedules on the day from the Schedule sheet, a workout already there marked so", () => {
    act(() => container.querySelector<HTMLButtonElement>(".page-action")?.click());
    const sheet = document.querySelector("dialog")!;
    expect(sheet.querySelector(".sheet-title")?.textContent).toBe("Schedule");
    expect(sheet.querySelector(".add-row-there")?.textContent).toBe("On this day");
  });
});
