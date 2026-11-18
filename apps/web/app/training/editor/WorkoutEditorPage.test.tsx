import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Route, Routes, useLocation } from "react-router";
import { TestRouter } from "../../lib/TestRouter";
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

const push: WorkoutRecord = {
  ...legs,
  id: "push",
  name: "Push",
  items: [
    { id: "a", exercise: "Bench press", doses: [{ sets: 3, reps: 8 }], restAfterS: 90 },
    { id: "b", exercise: "Dips", doses: [{ sets: 3, reps: 10 }] },
    { id: "c", exercise: "Face pull", doses: [{ sets: 3, reps: 15 }] },
  ],
};

const zercher: Exercise = {
  id: "z",
  name: "Zercher squat",
  kind: "strength",
  measure: "repsWeight",
  eachSide: false,
  progress: null,
  builtIn: null,
  description: "",
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
    const workouts = libraryOf([legs, push]);
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
  usePickerWorld: (_api: unknown, _model: unknown, inWorkout: string[], offer: string) => ({
    mine: [zercher],
    grips: [],
    uses: new Map(),
    inWorkout,
    offer,
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
          <TestRouter initialEntries={["/app/train", "/edit"]} initialIndex={1}>
            <Spy />
            <WithHang>
              <Routes>
                <Route path="/edit" element={page} />
                <Route path="*" element={<p data-left>left</p>} />
              </Routes>
            </WithHang>
          </TestRouter>
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
    click(container.querySelector(".editor-bar-save"));
    expect(writes.saveWorkout).toHaveBeenCalledWith("legs", expect.anything());
    expect(saved().name).toBe("Leg day");
    expect(saved().items[0]?.doses).toHaveLength(2);
    expect(at.path).toBe("/app/train");
  });

  it("keeps every character typed or pasted when Enter follows before a render, and focuses the line put in", () => {
    mount(<WorkoutEditorPage id="legs" />);
    click(
      [...container.querySelectorAll("button")].find((b) =>
        b.textContent?.includes("Add checklist")
      )
    );
    const line = (n: number): HTMLInputElement =>
      container.querySelector<HTMLInputElement>(`[aria-label="Line ${n}"]`)!;
    const enter = (el: HTMLInputElement, isComposing = false): void => {
      el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, isComposing }));
    };
    act(() => {
      const el = line(1);
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
        el,
        "Arm circles x20"
      );
      el.dispatchEvent(new Event("input", { bubbles: true }));
      enter(el);
    });
    expect(line(1).value).toBe("Arm circles x20");
    type(line(2), "Hang");
    act(() => enter(line(1)));
    expect(document.activeElement).toBe(line(2));
    expect([line(2).value, line(3).value]).toEqual(["", "Hang"]);
    act(() => enter(line(3), true));
    expect(container.querySelector('[aria-label="Line 4"]')).toBeNull();
  });

  it("types a checklist's lines in place, Enter adding the next, and saves the typed ones", () => {
    mount(<WorkoutEditorPage id="legs" />);
    const add = [...container.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("Add checklist")
    );
    click(add);
    const line = (n: number): HTMLInputElement =>
      container.querySelector<HTMLInputElement>(`[aria-label="Line ${n}"]`)!;
    type(line(1), "Jog 5 min");
    act(() => {
      line(1).dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    });
    expect(document.activeElement).toBe(line(2));
    type(line(2), "Arm circles x20");
    click(container.querySelector(".editor-bar-save"));
    expect(saved().items.at(-1)).toMatchObject({
      exercise: "Checklist",
      checklist: { lines: ["Jog 5 min", "Arm circles x20"] },
    });
  });

  it("makes a superset from the gap below an exercise, sets its rounds, and takes a member out", () => {
    mount(<WorkoutEditorPage id="push" />);
    click(
      [...container.querySelectorAll("button")].find((b) => b.textContent === "Superset with next")
    );
    const group = container.querySelector(".superset-editor")!;
    expect([...group.querySelectorAll(".letter-badge")].map((b) => b.textContent)).toEqual([
      "A",
      "B",
    ]);
    expect([...group.querySelectorAll(".letter-badge")].map((b) => b.className)).toEqual([
      "letter-badge letter-badge--0",
      "letter-badge letter-badge--0",
    ]);
    expect(group.querySelector('[aria-label="Move Bench press down"]')).not.toBeNull();
    expect(group.querySelector('[aria-label="Move Bench press up"]')).toBeNull();
    expect(group.querySelector('[aria-label="Move Dips down"]')).toBeNull();
    expect([...group.querySelectorAll(".superset-foot button")].map((b) => b.textContent)).toEqual([
      "+ Add to superset",
      "Ungroup",
    ]);
    click([...group.querySelectorAll("button")].find((b) => b.textContent === "+ Add to superset"));
    const listed = [...document.querySelectorAll('[role="checkbox"]')].map(
      (b) => b.getAttribute("aria-label") ?? b.textContent
    );
    expect(listed.some((n) => n?.includes("4x4s") || n?.includes("ARC"))).toBe(false);
    expect(listed.some((n) => n?.includes("Back squat"))).toBe(true);
    act(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
    click(container.querySelector('[aria-label="More rounds"]'));
    const rounds = container.querySelector<HTMLInputElement>(".superset-rounds input")!;
    expect(container.querySelector(`label[for="${rounds.id}"]`)?.textContent).toBe("Rounds");
    click(container.querySelector(".editor-bar-save"));
    const items = saved().items;
    expect(
      items.slice(0, 2).every((i) => i.group !== undefined && i.group.rounds === i.doses[0]?.sets)
    ).toBe(true);
  });

  it("moves a plain exercise past a whole superset, and the superset whole", () => {
    mount(<WorkoutEditorPage id="push" />);
    click(
      [...container.querySelectorAll("button")].find((b) => b.textContent === "Superset with next")
    );
    click(container.querySelector('[aria-label="Move Face pull up"]'));
    expect(container.querySelectorAll(".superset-editor")).toHaveLength(1);
    const names = (): string[] =>
      [...container.querySelectorAll(".item-editor-name")].map((e) => e.textContent ?? "");
    expect(names()).toEqual(["Face pull", "Superset", "Bench press", "Dips"]);
    click(container.querySelector('[aria-label="Move Superset up"]'));
    click(container.querySelector(".editor-bar-save"));
    expect(saved().items.map((i) => [i.exercise, i.group !== undefined])).toEqual([
      ["Bench press", true],
      ["Dips", true],
      ["Face pull", false],
    ]);
  });

  it("ends a superset when a member is taken out and one is left", () => {
    mount(<WorkoutEditorPage id="push" />);
    click(
      [...container.querySelectorAll("button")].find((b) => b.textContent === "Superset with next")
    );
    click(container.querySelector('[aria-label^="Take "][aria-label$=" out of the superset"]'));
    expect(container.querySelector(".superset-editor")).toBeNull();
  });

  it("edits each rest between exercises on its own, the workout's rest where one sets none", () => {
    mount(<WorkoutEditorPage id="push" />);
    const labels = (): string[] =>
      Array.from(container.querySelectorAll("label")).map((l) => l.textContent ?? "");
    const rest = (after: string): HTMLInputElement => {
      const label = Array.from(container.querySelectorAll("label")).find(
        (l) => l.textContent === `Rest after ${after}`
      )!;
      return document.getElementById(label.htmlFor) as HTMLInputElement;
    };
    expect(rest("Bench press").value).toBe("00:01:30");
    expect(rest("Dips").value).toBe("00:03:00");
    expect(labels()).not.toContain("Rest after Face pull");
    type(rest("Dips"), "000200");
    act(() => rest("Dips").dispatchEvent(new FocusEvent("focusout", { bubbles: true })));
    click(container.querySelector(".editor-bar-save"));
    expect(saved().items.map((i) => i.restAfterS)).toEqual([90, 120, undefined]);
  });

  it("types a set range with a hyphen, and back to one number", () => {
    mount(<WorkoutEditorPage id="legs" />);
    const sets = (): HTMLInputElement => {
      const label = Array.from(container.querySelectorAll("label")).find(
        (l) => l.textContent === "Sets"
      )!;
      return document.getElementById(label.htmlFor) as HTMLInputElement;
    };
    const blur = (): void =>
      act(() => {
        sets().dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
      });
    type(sets(), "5-3");
    blur();
    expect(sets().value).toBe("3-5");
    click(container.querySelector(".editor-bar-save"));
    expect(saved().items[0]?.doses).toEqual([{ sets: 3, setsMax: 5, reps: 5 }]);
  });

  it("asks before discarding changes, and leaves at once when nothing changed", () => {
    mount(<WorkoutEditorPage id="legs" />);
    type(container.querySelector<HTMLInputElement>(".name-field")!, "Leg day");
    click(container.querySelector(".editor-bar-cancel"));
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
    click(container.querySelector(".editor-bar-save"));
    const [id] = writes.saveWorkout.mock.calls[0] as unknown as [string];
    expect(id).not.toBe("legs");
    expect(saved().items[0]?.exercise).toBe("Zercher squat");
  });

  it("makes a new workout without asking its category, in its focus, then opens it", () => {
    mount(<WorkoutEditorPage focus="power" />);
    expect([...container.querySelectorAll("h1")].map((h) => h.textContent)).toEqual([
      "New workout",
    ]);
    type(container.querySelector<HTMLInputElement>(".name-field")!, "Fast pulls");
    click(container.querySelector(".editor-bar-save"));
    const [id] = writes.saveWorkout.mock.calls[0] as unknown as [string];
    expect(saved()).toMatchObject({ name: "Fast pulls", kind: "other", focus: "power" });
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
