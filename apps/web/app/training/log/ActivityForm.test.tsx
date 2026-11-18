import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import type { ActivityDraft } from "@sendtally/features/activities";
import type * as Activities from "@sendtally/features/activities";
import type * as Workouts from "@sendtally/features/workouts";
import type * as T_hang from "@sendtally/features/hang";
import { ToastProvider } from "../../components/Toast";
import { liveRunOf } from "../../lib/useLiveRun";
import { WithHang } from "../data/testHang";
import type { IdleEnd } from "@sendtally/features/workouts";
import { ActivityForm } from "./ActivityForm";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute("open", "");
};

const writes = vi.hoisted(() => ({
  saveActivity: vi.fn(async (): Promise<boolean> => true),
  deleteActivity: vi.fn(async () => undefined),
  saveWorkout: vi.fn(async () => undefined),
  deleteWorkout: vi.fn(async () => undefined),
}));

vi.mock("@sendtally/features/statistics", () => ({
  useExercises: () => ({
    state: {
      status: "ready",
      data: [{ name: "Circuit laps", kind: "climbing", measure: "laps", eachSide: false }],
    },
  }),
}));
vi.mock("@sendtally/features/hang", async (actual) => ({
  ...(await actual<typeof T_hang>()),
  useGrips: () => ({ isGrip: () => false, gripName: (id: string) => id }),
}));
vi.mock("@clerk/react-router", () => ({ useAuth: () => ({ userId: "u1" }) }));
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

const mount = (live = false, idleEnd: IdleEnd | null = null, initial = review): void =>
  act(() =>
    root.render(
      <ToastProvider>
        <MemoryRouter>
          <WithHang>
            <ActivityForm
              id="a1"
              initial={initial}
              logged={null}
              kindSet
              live={live}
              idleEnd={idleEnd}
            />
          </WithHang>
        </MemoryRouter>
      </ToastProvider>
    )
  );

const click = (el: Element | null | undefined): void => act(() => (el as HTMLElement).click());
const rows = (): NodeListOf<Element> => container.querySelectorAll("[data-testid=review-set]");
const save = (): void => click(container.querySelector(".editor-bar-save"));
const saved = (): ActivityDraft["done"] =>
  (writes.saveActivity.mock.calls[0] as unknown as [{ done: ActivityDraft["done"] }])[0].done;

describe("ActivityForm", () => {
  it("says under the duration that a run left open ended at its last set", () => {
    mount(true, { minutes: 50, line: "Ended at your last set, 6:42 PM · left open 2h 23m after" });
    const line = container.querySelector(".form-idle-note");
    expect(line?.textContent).toBe("Ended at your last set, 6:42 PM · left open 2h 23m after");
    expect(line?.previousElementSibling?.textContent).toContain("Duration");
    const field = container.querySelector<HTMLInputElement>(".number-field input")!;
    act(() => {
      field.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
    });
    expect(container.querySelector(".form-idle-note")).toBeNull();
  });

  it("reviews a workout with every set ticked, and saves what stays ticked", () => {
    mount();
    expect(container.querySelector("h1")?.textContent).toBe("Gym, legs");
    expect(rows()).toHaveLength(3);
    click(rows()[1]?.querySelector("input[type=checkbox]"));
    save();
    expect(writes.saveActivity).toHaveBeenCalledOnce();
    expect(saved()[0]?.sets).toHaveLength(2);
  });

  it("reviews a checklist as lines ticked of its count, saving the lines ticked", () => {
    const lines = ["Jog 5 min", "Arm circles x20", "Easy boulders x10"];
    mount(false, null, {
      ...review,
      done: [{ item: 0, exercise: "Checklist", sets: [], checklist: { lines, checked: [0] } }],
    });
    expect(container.textContent).toContain("Checklist · 1 of 3");
    const line = [...container.querySelectorAll("label")].find((l) =>
      l.textContent?.includes("Easy boulders x10")
    );
    click(line?.querySelector("input"));
    expect(container.textContent).toContain("Checklist · 2 of 3");
    save();
    expect(saved()[0]?.checklist).toEqual({ lines, checked: [0, 2] });
  });

  it("groups a superset's members under one header, from the log itself", () => {
    const group = { id: "s1", rounds: 2 };
    mount(false, null, {
      ...review,
      done: [
        { item: 0, exercise: "Pull-ups", sets: [{ reps: 6 }, { reps: 6 }], group },
        { item: 1, exercise: "Push-ups", sets: [{ reps: 15 }, { reps: 15 }], group },
        { item: 2, exercise: "Plank", sets: [{ onS: 45 }] },
      ],
    });
    const heads = [...container.querySelectorAll(".done-superset-head")].map((e) => e.textContent);
    expect(heads).toEqual(["Superset · 2 rounds"]);
    const text = container.textContent ?? "";
    expect(text.indexOf("Superset · 2 rounds")).toBeLessThan(text.indexOf("Pull-ups"));
    expect(text.indexOf("Push-ups")).toBeLessThan(text.indexOf("Plank"));
  });

  it("puts each checklist above the Sets heading, the exercises under it", () => {
    mount(false, null, {
      ...review,
      done: [
        { item: 0, exercise: "Checklist", sets: [], checklist: { lines: ["Jog"], checked: [0] } },
        { item: 1, exercise: "Back squat", sets: [{ reps: 5 }] },
        {
          item: 2,
          exercise: "Checklist",
          sets: [],
          checklist: { lines: ["Stretch"], checked: [] },
        },
      ],
    });
    const text = container.textContent ?? "";
    const at = (s: string): number => text.indexOf(s);
    expect(at("Checklist · 1 of 1")).toBeLessThan(at("Checklist · 0 of 1"));
    expect(at("Checklist · 0 of 1")).toBeLessThan(at("Sets"));
    expect(at("Sets")).toBeLessThan(at("Back squat"));
  });

  it("ends the live run it reviews when saved, and only after asking when discarded", async () => {
    const { store } = liveRunOf("u1");
    const running = (): void =>
      store.write({
        title: "Gym, legs",
        workoutId: "w1",
        pathname: "/workout/sets",
        params: {},
        startedAt: 0,
        state: { player: "sets", done: [], ticked: [] },
      });
    running();
    mount(true);
    click(container.querySelector(".editor-bar-cancel"));
    expect(store.read()).not.toBeNull();
    click(document.querySelector(".sheet-action--danger"));
    expect(store.read()).toBeNull();
    running();
    await act(async () => save());
    expect(store.read()).toBeNull();
  });

  it("stays on the form with no toast when the save fails", async () => {
    writes.saveActivity.mockResolvedValueOnce(false);
    mount();
    await act(async () => save());
    expect(writes.saveActivity).toHaveBeenCalledOnce();
    expect(document.querySelector(".toast")).toBeNull();
    expect(container.querySelector("h1")?.textContent).toBe("Gym, legs");
  });

  it("says what it logged once saved, with View to open it", async () => {
    mount();
    await act(async () => save());
    expect(document.querySelector(".toast")?.textContent).toContain("Logged Gym, legs");
    expect(document.querySelector(".toast-action")?.textContent).toBe("View");
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
