import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation, useParams } from "react-router";
import type { Exercise, WorkoutRecord } from "@sendtally/api-client";
import { setLibrary } from "@sendtally/features/library";
import { TEST_LIBRARY } from "@sendtally/features/library/testing";
import { libraryOf } from "@sendtally/features/workouts";
import { ToastProvider } from "../../components/Toast";
import { WithHang } from "../data/testHang";
import { ExercisePage } from "./ExercisePage";
import { ExerciseShelves } from "./ExerciseShelves";

import type * as T_useLibrary from "../library/useLibrary";
import type * as T_activities from "@sendtally/features/activities";
import type * as T_exercises from "@sendtally/features/exercises";
import type * as T_statistics from "@sendtally/features/statistics";

import type * as T_workouts from "@sendtally/features/workouts";
import type * as T_training from "@sendtally/features/training";

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
  description: "",
  archived: false,
  ...extra,
});

const state = vi.hoisted(() => ({
  exercises: [] as Exercise[],
  workouts: [] as WorkoutRecord[],
  merge: vi.fn(async () => true),
  remove: vi.fn(async () => true),
  access: null as boolean | null,
}));

vi.mock("@sendtally/features/billing", () => ({
  useMembership: () => ({ access: state.access }),
}));
vi.mock("../../lib/useAppApi", () => ({ useAppApi: () => ({}) }));
vi.mock("../data/usePlanActions", () => ({ usePlanActions: () => ({}) }));
vi.mock("@sendtally/features/training", async (actual) => ({
  ...(await actual<typeof T_training>()),
  useTrainingLog: () => ({
    log: {
      plan: { blocks: [], memberships: [], weekChanges: [], planChanges: [], membershipDays: [] },
    },
  }),
}));
vi.mock("../editor/useMake", () => ({ useMake: () => vi.fn(), usePick: () => vi.fn() }));
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
vi.mock("@sendtally/features/workouts", async (actual) => ({
  ...(await actual<typeof T_workouts>()),
  useWorkoutActions: () => ({ saveWorkout: vi.fn(), deleteWorkout: vi.fn() }),
}));
vi.mock("@sendtally/features/exercises", async (actual) => ({
  ...(await actual<typeof T_exercises>()),
  useExerciseList: () => state.exercises,
  useExerciseActions: () => ({ merge: state.merge, remove: state.remove }),
  useMakeExercise: () => vi.fn(),
}));

let container: HTMLDivElement;
let root: Root;
const at = { path: "", search: "" };

function Spy(): null {
  const { pathname: path, search } = useLocation();
  React.useEffect(() => {
    at.path = path;
    at.search = search;
  }, [path, search]);
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
  state.access = null;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  setLibrary(TEST_LIBRARY);
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
  it("shows the library's description on a built-in, and on the user's own copy of one", () => {
    setLibrary({
      ...TEST_LIBRARY,
      exercises: TEST_LIBRARY.exercises.map((e) =>
        e.id === "pullUps" ? { ...e, description: "Shoulders down first." } : e
      ),
    });
    mount("/app/train/exercise/pullUps");
    expect(container.querySelector("h1")?.textContent).toBe("Pull-ups");
    expect(container.querySelector(".desc-text")?.textContent).toBe("Shoulders down first.");

    act(() => root.unmount());
    root = createRoot(container);
    state.exercises = [ex("mine", "Pull-ups", { builtIn: "pullUps", description: "Stale" })];
    mount("/app/train/exercise/mine");
    expect(container.querySelector(".desc-text")?.textContent).toBe("Shoulders down first.");
  });

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
    expect(menu()).toEqual(["Add to workout", "Schedule", "Merge into…", "Archive"]);
  });

  it("deletes one nothing uses, after asking, and goes back", () => {
    mount("/app/train/exercise/bench");
    expect(menu()).toEqual(["Schedule", "Merge into…", "Delete"]);
    click(button("Delete"));
    click(document.querySelector(".sheet-action--danger"));
    expect(state.remove).toHaveBeenCalledWith("bench");
    expect(at.path).toBe("/app/train");
  });

  it("schedules an exercise with no workout of its own yet by the exercise", () => {
    mount("/app/train/exercise/bench");
    menu();
    click(button("Schedule"));
    expect(at.path).toBe("/app/plan/schedule");
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

describe("ExercisePage without access", () => {
  it("gives a locked exercise's page way to Membership, and locks a built-in's Add to workout", () => {
    state.access = false;
    mount("/app/train/exercise/squat");
    expect(`${at.path}${at.search}`).toBe("/app/membership?source=exercise");
    expect(container.querySelector("h1")).toBeNull();

    act(() => root.unmount());
    root = createRoot(container);
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
    mount("/app/train/exercise/pullUps");
    menu();
    const items = [...document.querySelectorAll(".more-item")];
    expect(items.map((b) => b.getAttribute("aria-label"))).toEqual([
      "Add to workout, members only",
      null,
    ]);
    click(items[0]);
    expect(`${at.path}${at.search}`).toBe("/app/membership?source=exercise");
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
