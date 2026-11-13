import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import type { Exercise, WorkoutRecord } from "@sendtally/api-client";
import type * as Statistics from "@sendtally/features/statistics";
import type * as Workouts from "@sendtally/features/workouts";
import { libraryOf, type WorkoutDraft, type WorkoutLibrary } from "@sendtally/features/workouts";
import { ToastProvider } from "../../components/Toast";
import { WithHang } from "../data/testHang";
import { WorkoutEditorPage } from "./WorkoutEditorPage";

import type * as T_useLibrary from "../library/useLibrary";

import type * as T_exercises from "@sendtally/features/exercises";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute("open", "");
};

const legs: WorkoutRecord = {
  id: "legs",
  kind: "strength",
  name: "Gym, legs",
  description: "",
  minutes: 50,
  targetRpe: null,
  items: [{ exercise: "Zercher squat", doses: [{ sets: 5, reps: 5 }] }],
  exerciseRestS: 180,
  focus: "strength",
  updatedAt: "t",
};

const zercher: Exercise = {
  id: "z",
  name: "Zercher squat",
  kind: "strength",
  measure: "repsWeight",
  eachSide: false,
  progress: null,
  builtIn: null,
  archived: false,
};

const writes = vi.hoisted(() => ({
  saveWorkout: vi.fn(async () => undefined),
  deleteWorkout: vi.fn(),
}));

vi.mock("../../lib/useAppApi", () => ({ useAppApi: () => ({}) }));
vi.mock("../library/useLibrary", async (actual) => ({
  ...(await actual<typeof T_useLibrary>()),
  useLibrary: () => {
    const workouts = libraryOf([legs]);
    const data: WorkoutLibrary = {
      workouts,
      usage: new Map(),
      workout: (id) => workouts.find((w) => w.id === id),
    };
    return { state: { status: "ready", data }, reload: vi.fn() };
  },
}));
vi.mock("@sendtally/features/workouts", async (actual) => ({
  ...(await actual<typeof Workouts>()),
  useWorkoutActions: () => writes,
}));
vi.mock("@sendtally/features/exercises", async (actual) => ({
  ...(await actual<typeof T_exercises>()),
  usePickerWorld: (_api: unknown, _model: unknown, inWorkout: string[], fingers: boolean) => ({
    mine: [zercher],
    grips: [],
    uses: new Map(),
    inWorkout,
    fingers,
  }),
}));
vi.mock("@sendtally/features/statistics", async (actual) => ({
  ...(await actual<typeof Statistics>()),
  useExercises: () => ({ state: { status: "ready", data: [zercher] }, reload: vi.fn() }),
  useExerciseSeries: () => ({ status: "ready", data: [] }),
}));

let container: HTMLDivElement;
let root: Root;
const at = { path: "" };

function Spy(): null {
  const path = useLocation().pathname;
  React.useEffect(() => {
    at.path = path;
  }, [path]);
  return null;
}

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

function mount(page: React.ReactNode): void {
  act(() =>
    root.render(
      <QueryClientProvider client={new QueryClient()}>
        <ToastProvider>
          <MemoryRouter initialEntries={["/app/train", "/edit"]} initialIndex={1}>
            <Spy />
            <WithHang>
              <Routes>
                <Route path="/edit" element={page} />
                <Route path="*" element={<p data-left>left</p>} />
              </Routes>
            </WithHang>
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    )
  );
}

const type = (el: HTMLInputElement | HTMLTextAreaElement, value: string): void =>
  act(() => {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement;
    Object.getOwnPropertyDescriptor(proto.prototype, "value")!.set!.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
const click = (el: Element | null | undefined): void => act(() => (el as HTMLElement).click());
const saved = (): WorkoutDraft =>
  (writes.saveWorkout.mock.calls[0] as unknown as [string, WorkoutDraft])[1];

describe("WorkoutEditorPage", () => {
  it("edits one of the user's own workouts and saves it under its id", () => {
    mount(<WorkoutEditorPage id="legs" />);
    const name = container.querySelector<HTMLInputElement>(".name-field")!;
    expect(name.value).toBe("Gym, legs");
    type(name, "Leg day");
    click(container.querySelector('[role="switch"]'));
    expect(container.querySelectorAll(".letter-badge")).toHaveLength(2);
    click(container.querySelector(".detail-primary"));
    expect(writes.saveWorkout).toHaveBeenCalledWith("legs", expect.anything());
    expect(saved().name).toBe("Leg day");
    expect(saved().items[0]?.doses).toHaveLength(2);
    expect(at.path).toBe("/app/train");
  });

  it("asks before discarding changes, and leaves at once when nothing changed", () => {
    mount(<WorkoutEditorPage id="legs" />);
    type(container.querySelector<HTMLInputElement>(".name-field")!, "Leg day");
    click(container.querySelector(".detail-back"));
    expect(container.querySelector("[data-left]")).toBeNull();
    click(document.querySelector(".sheet-action--danger"));
    expect(container.querySelector("[data-left]")).not.toBeNull();
    expect(writes.saveWorkout).not.toHaveBeenCalled();
  });

  it("starts from a copy of a workout and saves it as a new one", () => {
    mount(<WorkoutEditorPage from="legs" />);
    expect(container.querySelector<HTMLInputElement>(".name-field")?.value).toBe(
      "Gym, legs (copy)"
    );
    click(container.querySelector(".detail-primary"));
    const [id] = writes.saveWorkout.mock.calls[0] as unknown as [string];
    expect(id).not.toBe("legs");
    expect(saved().items[0]?.exercise).toBe("Zercher squat");
  });

  it("makes a new workout in its category and focus, then opens it", () => {
    mount(<WorkoutEditorPage kind="strength" focus="power" />);
    type(container.querySelector<HTMLInputElement>(".name-field")!, "Fast pulls");
    click(container.querySelector(".detail-primary"));
    const [id] = writes.saveWorkout.mock.calls[0] as unknown as [string];
    expect(saved()).toMatchObject({ name: "Fast pulls", kind: "strength", focus: "power" });
    expect(at.path).toBe(`/app/train/workouts/${id}`);
  });

  it("adds ticked exercises from the picker in the order ticked", async () => {
    mount(<WorkoutEditorPage id="legs" />);
    click(
      [...container.querySelectorAll("button")].find((b) =>
        b.textContent?.includes("Add exercises")
      )
    );
    const rows = [...document.querySelectorAll<HTMLElement>(".picker-row")];
    const named = (n: string): HTMLElement | undefined =>
      rows.find((r) => r.querySelector(".picker-row-name")?.textContent === n);
    click(named("Zercher squat"));
    expect(named("Zercher squat")?.getAttribute("aria-checked")).toBe("true");
    await act(async () => {
      document.querySelector<HTMLElement>(".sheet-action")!.click();
    });
    expect(container.querySelectorAll(".item-editor")).toHaveLength(2);
  });
});
