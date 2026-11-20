import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import type { ActivityRecord } from "@sendtally/api-client";
import type * as Activities from "@sendtally/features/activities";
import type * as Statistics from "@sendtally/features/statistics";
import type * as Training from "@sendtally/features/training";
import { ToastProvider } from "../../components/Toast";
import { aHang, hangData, WithHang } from "../data/testHang";
import { WorkoutSummaryPage } from "./WorkoutSummaryPage";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute("open", "");
};

const legs: ActivityRecord = {
  id: "a1",
  kind: "strength",
  title: "Gym, legs",
  date: "2026-09-20",
  startTime: "18:00",
  minutes: 50,
  rpe: 8,
  notes: null,
  workoutId: null,
  membershipId: null,
  week: null,
  focus: null,
  done: [
    {
      item: 0,
      exercise: "Back squat",
      sets: [
        { reps: 5, weightKg: 80 },
        { reps: 5, weightKg: 85 },
      ],
    },
  ],
  stravaActivityId: null,
  postedAt: null,
  postState: null,
  postError: null,
};

const writes = vi.hoisted(() => ({
  saveActivity: vi.fn(async () => undefined),
  deleteActivity: vi.fn(async () => undefined),
}));
const deleteSession = vi.fn(async () => undefined);

vi.mock("../../lib/useAppApi", () => ({ useAppApi: () => ({}) }));
vi.mock("@sendtally/features/activities", async (actual) => ({
  ...(await actual<typeof Activities>()),
  useActivityActions: () => writes,
  useActivities: () => ({
    state: { status: "ready", data: [legs, { ...legs, id: "a2", workoutId: "w1" }] },
    reload: vi.fn(),
  }),
  useActivityPost: () => ({ state: null, run: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@sendtally/features/statistics", async (actual) => ({
  ...(await actual<typeof Statistics>()),
  useExercises: () => ({ state: { status: "ready", data: [] } }),
}));
vi.mock("@sendtally/features/training", async (actual) => ({
  ...(await actual<typeof Training>()),
  useTrainingLog: () => ({ log: { workout: () => undefined } }),
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.clearAllMocks();
  window.matchMedia = vi.fn(() => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function mount(id: string): void {
  act(() =>
    root.render(
      <ToastProvider>
        <MemoryRouter initialEntries={["/app", `/app/activity/${id}`]} initialIndex={1}>
          <WithHang
            data={hangData({ sessions: [aHang({ id: "h1", loadKg: 10 })] })}
            actions={{ deleteSession }}
          >
            <Routes>
              <Route path="/app/activity/:id" element={<WorkoutSummaryPage id={id} />} />
              <Route path="*" element={<p data-left>left</p>} />
            </Routes>
          </WithHang>
        </MemoryRouter>
      </ToastProvider>
    )
  );
}

const click = (el: Element | null | undefined): void => act(() => (el as HTMLElement).click());
const text = (): string => container.textContent ?? "";

describe("WorkoutSummaryPage", () => {
  it("shows its length and RPE, and each exercise as read rows, with Edit beside the menu", () => {
    mount("a1");
    expect(container.querySelector("h1")?.textContent).toBe("Gym, legs");
    const tiles = [...container.querySelectorAll(".detail-tile")].map((t) => t.textContent);
    expect(tiles).toHaveLength(2);
    expect(text()).not.toContain("What you did");
    expect(container.querySelector(".exercise-head-name")?.textContent).toBe("Back squat");
    const rows = [...container.querySelectorAll(".set-read-value")].map((r) => r.textContent);
    expect(rows).toEqual(["5 reps × 80 kg", "5 reps × 85 kg"]);
    expect(container.querySelector(".edit-button")?.getAttribute("href")).toBe(
      "/app/activity/a1/edit"
    );
  });

  it("opens its workout's history from the header when it ran a workout", () => {
    mount("a2");
    expect(container.querySelector(".detail-actions a")?.getAttribute("href")).toBe(
      "/app/train/workouts/w1/history?current=a2"
    );
  });

  it("deletes after asking, then goes back", () => {
    mount("a1");
    click(container.querySelector('[aria-label="More"]'));
    click([...document.querySelectorAll(".more-item")].at(-1));
    click(document.querySelector(".sheet-action--danger"));
    expect(writes.deleteActivity).toHaveBeenCalledWith("a1");
    expect(container.querySelector("[data-left]")).not.toBeNull();
  });

  it("shows a hang session's grid and how many hangs it held", () => {
    mount("h1");
    expect(container.querySelectorAll(".hang-cell--held")).toHaveLength(6);
    expect(container.querySelector(".hang-count")?.textContent).toContain("6 of 6 hangs");
  });
});
