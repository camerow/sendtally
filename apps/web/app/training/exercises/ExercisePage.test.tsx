import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation, useParams } from "react-router";
import type { Exercise, WorkoutRecord } from "@sendtally/api-client";
import { libraryOf } from "@sendtally/features/workouts";
import { ToastProvider } from "../../components/Toast";
import { WithHang } from "../data/testHang";
import { ExercisePage } from "./ExercisePage";
import { ExerciseShelves } from "./ExerciseShelves";

import type * as T_useLibrary from "../library/useLibrary";
import type * as T_activities from "@sendtally/features/activities";
import type * as T_exercises from "@sendtally/features/exercises";
import type * as T_statistics from "@sendtally/features/statistics";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute("open", "");
};

const ex = (id: string, name: string, extra: Partial<Exercise> = {}): Exercise => ({
  id,
  name,
  kind: "strength",
  measure: "repsWeight",
  eachSide: false,
  progress: null,
  builtIn: null,
  archived: false,
  ...extra,
});

const state = vi.hoisted(() => ({
  exercises: [] as Exercise[],
  workouts: [] as WorkoutRecord[],
  merge: vi.fn(async () => true),
  remove: vi.fn(async () => true),
}));

vi.mock("../../lib/useAppApi", () => ({ useAppApi: () => ({}) }));
vi.mock("../library/useLibrary", async (actual) => ({
  ...(await actual<typeof T_useLibrary>()),
  useLibrary: () => ({
    state: { status: "ready", data: { workouts: libraryOf(state.workouts) } },
    reload: vi.fn(),
  }),
}));
vi.mock("@sendtally/features/statistics", async (actual) => ({
  ...(await actual<typeof T_statistics>()),
  useExercises: () => ({ state: { status: "ready", data: state.exercises }, reload: vi.fn() }),
  useExerciseSeries: () => ({ status: "ready", data: [] }),
}));
vi.mock("@sendtally/features/activities", async (actual) => ({
  ...(await actual<typeof T_activities>()),
  useActivities: () => ({ state: { status: "ready", data: [] } }),
  useWeightUnit: () => "kg",
}));
vi.mock("@sendtally/features/exercises", async (actual) => ({
  ...(await actual<typeof T_exercises>()),
  useExerciseActions: () => ({ merge: state.merge, remove: state.remove }),
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

function Page(): React.ReactElement | null {
  return <ExercisePage id={useParams().id ?? ""} />;
}

beforeEach(() => {
  vi.clearAllMocks();
  window.matchMedia = vi.fn(() => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
  state.exercises = [ex("squat", "Zercher squat"), ex("bench", "Floor press"), ex("rdl", "RDL")];
  state.workouts = [];
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function mount(start: string, node: React.ReactNode = <Page />): void {
  act(() =>
    root.render(
      <ToastProvider>
        <MemoryRouter initialEntries={["/app/train", start]} initialIndex={1}>
          <Spy />
          <WithHang>
            <Routes>
              <Route path="/app/train/exercise/:id" element={node} />
              <Route path="*" element={node} />
            </Routes>
          </WithHang>
        </MemoryRouter>
      </ToastProvider>
    )
  );
}

const click = (el: Element | null | undefined): void => act(() => (el as HTMLElement).click());
const button = (label: string): HTMLElement | undefined =>
  [...document.querySelectorAll<HTMLElement>("button")].find((b) => b.textContent === label);
const menu = (): string[] => {
  click(container.querySelector('[aria-label="More"]'));
  return [...document.querySelectorAll(".more-item")].map((b) => b.textContent ?? "");
};

describe("ExercisePage", () => {
  it("says nothing is logged yet, and lists the workouts using it", () => {
    state.workouts = [
      {
        id: "legs",
        kind: "strength",
        name: "Gym, legs",
        description: "",
        minutes: 50,
        targetRpe: null,
        items: [{ exercise: "Zercher squat", doses: [{ sets: 5, reps: 5 }] }],
        exerciseRestS: 180,
        focus: null,
        updatedAt: "t",
      },
    ];
    mount("/app/train/exercise/squat");
    expect(container.querySelector("h1")?.textContent).toBe("Zercher squat");
    expect(container.querySelector(".dashed-panel")).not.toBeNull();
    expect(container.querySelector(".link-row")?.getAttribute("href")).toBe(
      "/app/train/workouts/legs"
    );
    expect(menu()).toEqual(["Merge into…", "Archive"]);
  });

  it("deletes one nothing uses, after asking, and goes back", () => {
    mount("/app/train/exercise/bench");
    expect(menu()).toEqual(["Merge into…", "Delete"]);
    click(button("Delete"));
    click(document.querySelector(".sheet-action--danger"));
    expect(state.remove).toHaveBeenCalledWith("bench");
    expect(at.path).toBe("/app/train");
  });

  it("merges into the picked exercise once confirmed, then opens it", async () => {
    mount("/app/train/exercise/bench");
    menu();
    click(button("Merge into…"));
    click(button("RDL"));
    expect(state.merge).not.toHaveBeenCalled();
    click(document.querySelector(".sheet-action--danger"));
    await act(async () => undefined);
    expect(state.merge).toHaveBeenCalledWith(
      expect.objectContaining({ id: "bench" }),
      expect.objectContaining({ id: "rdl" })
    );
    expect(at.path).toBe("/app/train/exercise/rdl");
  });
});

describe("ExerciseShelves", () => {
  it("shelves every category with Fingers grips first, each row opening its page", () => {
    mount("/app/train", <ExerciseShelves />);
    const titles = [...container.querySelectorAll(".shelf-title")].map((h) => h.textContent);
    expect(titles).toContain("Fingers");
    expect(titles).toContain("Strength");
    const hrefs = [...container.querySelectorAll(".category-row")].map((a) =>
      a.getAttribute("href")
    );
    expect(hrefs).toContain("/app/train/exercise/squat");
    expect(hrefs.some((h) => h?.startsWith("/app/train/grip/"))).toBe(true);
  });
});
