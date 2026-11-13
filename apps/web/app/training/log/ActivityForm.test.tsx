import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import type { ActivityDraft } from "@sendtally/features/activities";
import type * as Activities from "@sendtally/features/activities";
import type * as Workouts from "@sendtally/features/workouts";
import { ToastProvider } from "../../components/Toast";
import { WithHang } from "../data/testHang";
import { ActivityForm } from "./ActivityForm";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute("open", "");
};

const writes = vi.hoisted(() => ({
  saveActivity: vi.fn(async () => undefined),
  deleteActivity: vi.fn(async () => undefined),
  saveWorkout: vi.fn(async () => undefined),
  deleteWorkout: vi.fn(async () => undefined),
}));

vi.mock("../../lib/useAppApi", () => ({ useAppApi: () => ({}) }));
vi.mock("@sendtally/features/activities", async (actual) => ({
  ...(await actual<typeof Activities>()),
  useActivityActions: () => writes,
  useActivities: () => ({ state: { status: "ready", data: [] } }),
  useWeightUnit: () => "kg",
}));
vi.mock("@sendtally/features/workouts", async (actual) => ({
  ...(await actual<typeof Workouts>()),
  useWorkoutActions: () => writes,
}));

const review: ActivityDraft = {
  kind: "strength",
  title: "Gym, legs",
  date: "2026-09-29",
  startTime: "",
  minutes: 50,
  rpe: null,
  notes: "",
  workoutId: "legs",
  membershipId: null,
  week: null,
  focus: "strength",
  done: [{ item: 0, exercise: "Back squat", sets: [{ reps: 5 }, { reps: 5 }, { reps: 5 }] }],
  off: [],
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.clearAllMocks();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const mount = (): void =>
  act(() =>
    root.render(
      <ToastProvider>
        <MemoryRouter>
          <WithHang>
            <ActivityForm id="a1" initial={review} logged={null} kindSet />
          </WithHang>
        </MemoryRouter>
      </ToastProvider>
    )
  );

const click = (el: Element | null | undefined): void => act(() => (el as HTMLElement).click());
const rows = (): NodeListOf<Element> => container.querySelectorAll("[data-testid=review-set]");
const save = (): void => click(container.querySelector(".detail-primary"));
const saved = (): ActivityDraft["done"] =>
  (writes.saveActivity.mock.calls[0] as unknown as [{ done: ActivityDraft["done"] }])[0].done;

describe("ActivityForm", () => {
  it("reviews a workout with every set ticked, and saves what stays ticked", () => {
    mount();
    expect(container.querySelector("h1")?.textContent).toBe("Gym, legs");
    expect(rows()).toHaveLength(3);
    click(rows()[1]?.querySelector("input[type=checkbox]"));
    save();
    expect(writes.saveActivity).toHaveBeenCalledOnce();
    expect(saved()[0]?.sets).toHaveLength(2);
  });

  it("removes a set with an Undo that puts it back", () => {
    mount();
    click(rows()[2]?.querySelector(".set-remove"));
    expect(rows()).toHaveLength(2);
    const undo = document.querySelector<HTMLElement>(".toast-action");
    expect(undo?.textContent).toBe("Undo");
    click(undo);
    expect(rows()).toHaveLength(3);
  });

  it("asks before removing an exercise's last set", () => {
    mount();
    click(rows()[2]?.querySelector(".set-remove"));
    click(rows()[1]?.querySelector(".set-remove"));
    click(rows()[0]?.querySelector(".set-remove"));
    expect(rows()).toHaveLength(1);
    click(document.querySelector(".sheet-action--danger"));
    expect(rows()).toHaveLength(0);
  });
});
