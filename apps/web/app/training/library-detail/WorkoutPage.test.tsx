import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useNavigationType,
  useParams,
} from "react-router";
import type { Plan, WorkoutRecord } from "@sendtally/api-client";
import { libraryOf, type WorkoutLibrary } from "@sendtally/features/workouts";
import { ToastProvider } from "../../components/Toast";
import { WorkoutPage } from "./WorkoutPage";

import type * as T_useLibrary from "../library/useLibrary";
import type * as T_activities from "@sendtally/features/activities";
import type * as T_statistics from "@sendtally/features/statistics";
import type * as T_training from "@sendtally/features/training";
import type * as T_workouts from "@sendtally/features/workouts";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute("open", "");
};

const writes = vi.hoisted(() => ({
  saveWorkout: vi.fn(async () => undefined),
  deleteWorkout: vi.fn(async () => undefined),
  deleteMembership: vi.fn(async () => undefined),
  plan: null as unknown as Plan,
}));

const legs: WorkoutRecord = {
  id: "legs",
  kind: "strength",
  name: "Gym, legs",
  description: "Heavy lower body.",
  minutes: 50,
  targetRpe: 8,
  items: [
    { exercise: "Back squat", doses: [{ sets: 5, reps: 5 }] },
    { exercise: "Deadlift", doses: [{ sets: 3, reps: 5 }] },
  ],
  exerciseRestS: 180,
  focus: "strength",
  updatedAt: "t",
};

const library = (): WorkoutLibrary => {
  const workouts = libraryOf([legs]);
  return {
    workouts,
    usage: new Map([["legs", { count: 3, last: "2026-11-10" }]]),
    workout: (id) => workouts.find((w) => w.id === id),
  };
};

vi.mock("../library/useLibrary", async (actual) => ({
  ...(await actual<typeof T_useLibrary>()),
  useLibrary: () => ({ state: { status: "ready", data: library() }, reload: vi.fn() }),
}));
vi.mock("../../lib/useAppApi", () => ({ useAppApi: () => ({}) }));
vi.mock("../data/HangDataContext", () => ({
  useHangData: () => ({
    model: { settings: { units: "kg" }, sessions: [], workout: () => undefined },
    today: "2026-11-12",
  }),
}));
vi.mock("./WorkoutOverTime", () => ({ WorkoutOverTime: () => null }));
vi.mock("@sendtally/features/statistics", async (actual) => ({
  ...(await actual<typeof T_statistics>()),
  useExercises: () => ({ state: { status: "ready", data: [] } }),
}));
vi.mock("@sendtally/features/activities", async (actual) => ({
  ...(await actual<typeof T_activities>()),
  useActivities: () => ({ state: { status: "ready", data: [] } }),
}));
vi.mock("@sendtally/features/workouts", async (actual) => ({
  ...(await actual<typeof T_workouts>()),
  useWorkoutActions: () => writes,
}));
vi.mock("@sendtally/features/training", async (actual) => ({
  ...(await actual<typeof T_training>()),
  usePlan: () => ({ state: { status: "ready", data: writes.plan } }),
  usePlanActions: () => writes,
}));

let container: HTMLDivElement;
let root: Root;
const at = { path: "", action: "" };

beforeEach(() => {
  vi.clearAllMocks();
  window.matchMedia = vi.fn(() => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
  writes.plan = {
    blocks: [],
    memberships: [],
    weekChanges: [],
    planChanges: [],
    membershipDays: [],
  };
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function Spy(): null {
  const path = useLocation().pathname;
  const action = useNavigationType();
  React.useEffect(() => {
    Object.assign(at, { path, action });
  }, [path, action]);
  return null;
}

function WorkoutPageAt(): React.ReactElement | null {
  return <WorkoutPage id={useParams().id ?? ""} />;
}

function mount(id: string): void {
  act(() =>
    root.render(
      <ToastProvider>
        <MemoryRouter initialEntries={["/app/train", `/app/train/workouts/${id}`]} initialIndex={1}>
          <Spy />
          <Routes>
            <Route path="/app/train" element={<p>Train</p>} />
            <Route path="/app/train/workouts/:id" element={<WorkoutPageAt />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    )
  );
}

const click = (el: Element | null | undefined): void => act(() => (el as HTMLElement).click());

const button = (text: string): HTMLElement | undefined =>
  [...document.querySelectorAll<HTMLElement>("button")].find((b) => b.textContent === text);

const menu = (): string[] => {
  click(document.querySelector('[aria-label="More"]'));
  return [...document.querySelectorAll(".more-item")].map((b) => b.textContent ?? "");
};

describe("WorkoutPage", () => {
  it("shows what it is and what its next session holds", () => {
    mount("legs");
    expect(container.querySelector("h1")?.textContent).toBe("Gym, legs");
    expect(container.textContent).toContain("Heavy lower body.");
    expect(container.querySelector(".intro-meta")?.textContent).toContain("Used 3 times");
    const rows = [...container.querySelectorAll(".preview-row-title")].map((r) => r.textContent);
    expect(rows).toEqual(["Back squat", "Deadlift"]);
    expect(container.querySelector(".rest-divider")?.textContent).toContain("3:00");
  });

  it("duplicates into a copy that takes the original's place", async () => {
    mount("legs");
    expect(menu()).toEqual(["Duplicate", "Delete workout"]);
    click(button("Duplicate"));
    expect(writes.saveWorkout).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ name: "Gym, legs (copy)" })
    );
    const [id] = writes.saveWorkout.mock.calls[0] as unknown as [string];
    expect(at.path).toBe(`/app/train/workouts/${id}`);
    expect(at.action).toBe("REPLACE");
  });

  it("asks before deleting the user's own, then goes back", async () => {
    mount("legs");
    menu();
    click(button("Delete workout"));
    expect(writes.deleteWorkout).not.toHaveBeenCalled();
    click(document.querySelector(".sheet-action--danger"));
    await act(async () => undefined);
    expect(writes.deleteWorkout).toHaveBeenCalledWith("legs");
    expect(at.path).toBe("/app/train");
  });

  it("offers only Duplicate on a built-in", () => {
    const builtIn = libraryOf([]).find((w) => w.kind === "strength")!;
    mount(builtIn.id);
    expect(menu()).toEqual(["Duplicate"]);
  });

  it("lists where it is planned, and takes it out after asking", () => {
    writes.plan = {
      ...writes.plan,
      memberships: [
        {
          id: "m1",
          workoutId: "legs",
          blockId: null,
          weekdays: [0, 3],
          start: "2026-11-01",
          position: 0,
        },
      ],
    };
    mount("legs");
    expect(container.textContent).toContain("Planned in");
    expect(container.querySelector(".plan-row-name")?.textContent).toBe("Ongoing");
    click(container.querySelector(".plan-row-remove"));
    click(document.querySelector(".sheet-action--danger"));
    expect(writes.deleteMembership).toHaveBeenCalledWith("m1");
  });
});
