import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router";
import type { WorkoutRecord } from "@sendtally/api-client";
import { libraryOf, type WorkoutLibrary as Library } from "@sendtally/features/workouts";
import { ToastProvider } from "../../components/Toast";
import { WorkoutLibrary } from "./WorkoutLibrary";
import { CategoryPage } from "./CategoryPage";

import type * as T_useLibrary from "./useLibrary";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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

const library = (): Library => {
  const workouts = libraryOf([legs]);
  return {
    workouts,
    usage: new Map([["legs", { count: 2, last: "2026-11-10" }]]),
    workout: (id) => workouts.find((w) => w.id === id),
  };
};

const state = vi.hoisted(() => ({ access: null as boolean | null, deleteWorkout: vi.fn() }));
vi.mock("@sendtally/features/billing", () => ({
  useMembership: () => ({ access: state.access }),
}));
vi.mock("@sendtally/features/workouts", async (actual) => ({
  ...(await actual<object>()),
  useWorkoutActions: () => ({ deleteWorkout: state.deleteWorkout }),
}));
vi.mock("../../lib/useAppApi", () => ({ useAppApi: () => ({}) }));
vi.mock("@sendtally/features/exercises", async (actual) => ({
  ...(await actual<object>()),
  useExerciseList: () => [],
}));
vi.mock("./useLibrary", async (actual) => ({
  ...(await actual<typeof T_useLibrary>()),
  useLibrary: () => ({ state: { status: "ready", data: library() }, reload: vi.fn() }),
}));
vi.mock("../data/HangDataContext", () => ({
  useHangData: () => ({
    model: { settings: { units: "kg" } },
  }),
}));

HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute("open", "");
};

let container: HTMLDivElement;
let root: Root;
const at = { path: "" };

function Spy(): null {
  const { pathname, search } = useLocation();
  React.useEffect(() => {
    at.path = `${pathname}${search}`;
  }, [pathname, search]);
  return null;
}

beforeEach(() => {
  state.access = null;
  state.deleteWorkout.mockClear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const mount = (node: React.ReactNode): void =>
  act(() =>
    root.render(
      <ToastProvider>
        <MemoryRouter>
          <Spy />
          {node}
        </MemoryRouter>
      </ToastProvider>
    )
  );

const search = (text: string): void => {
  const input = container.querySelector<HTMLInputElement>("input[type=search]")!;
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, text);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
};

const links = (): string[] =>
  [...container.querySelectorAll("a")].map((a) => a.getAttribute("href") ?? "");

describe("WorkoutLibrary", () => {
  it("shows a shelf per focus, the user's own first, with See all past three", () => {
    mount(<WorkoutLibrary />);
    const titles = [...container.querySelectorAll(".shelf-title")].map((h) => h.textContent);
    expect(titles[0]).toBe("Strength");
    expect(titles.at(-1)).toBe("General");
    const strength = container.querySelector(".library-shelf")!;
    expect(strength.querySelectorAll(".category-row")).toHaveLength(3);
    expect(strength.querySelector(".category-row")?.textContent).toContain("Gym, legs");
    expect(links()).toContain("/app/train/strength");
    expect(links()).toContain("/app/train/workouts/legs");
  });

  it("lists what a search finds as cards, or says nothing matched", () => {
    mount(<WorkoutLibrary />);
    search("legs");
    expect(container.querySelector(".library-shelves")).toBeNull();
    const cards = container.querySelectorAll(".library-card");
    expect(cards).toHaveLength(1);
    expect(cards[0]?.textContent).toContain("Gym, legs");
    expect(cards[0]?.textContent).not.toContain("Used");
    search("zzzz");
    expect(container.querySelector(".dashed-panel")).not.toBeNull();
  });
});

describe("WorkoutLibrary without access", () => {
  it("locks the user's own workout and the shelf plus, and leaves a built-in open", () => {
    state.access = false;
    mount(<WorkoutLibrary />);
    const legs = container.querySelector('a[aria-label="Gym, legs, members only"]');
    expect(legs?.getAttribute("href")).toBe("/app/membership?source=workout");
    expect(legs?.querySelector(".lock")).not.toBeNull();
    expect(links()).not.toContain("/app/train/workouts/legs");
    const builtIn = [...container.querySelectorAll(".category-row")].find(
      (a) => a.getAttribute("aria-label") === null
    );
    expect(builtIn?.getAttribute("href")).toMatch(/^\/app\/train\/workouts\//);
    const plus = container.querySelector<HTMLElement>(
      '[aria-label="New workout in Strength, members only"]'
    );
    act(() => plus?.click());
    expect(at.path).toBe("/app/membership?source=create");
  });

  it("offers only Delete on a locked workout's ···, through its delete confirm", () => {
    state.access = false;
    mount(<WorkoutLibrary />);
    const rows = container.querySelectorAll(".locked-row");
    expect(rows).toHaveLength(1);
    act(() => rows[0]?.querySelector<HTMLElement>(".more-button")?.click());
    const items = [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')];
    expect(items.map((i) => i.textContent)).toEqual(["Delete workout"]);
    act(() => items[0]?.click());
    expect(document.querySelector("dialog .sheet-title")?.textContent).toContain("Gym, legs");
    act(() => document.querySelector<HTMLElement>("dialog .sheet-action")?.click());
    expect(state.deleteWorkout).toHaveBeenCalledWith("legs");
  });
});

describe("CategoryPage", () => {
  it("lists every workout of one focus, searchable", () => {
    mount(<CategoryPage focus="strength" />);
    expect(container.querySelector("h1")?.textContent).toBe("Strength");
    const all = container.querySelectorAll(".library-card").length;
    expect(all).toBeGreaterThan(3);
    search("legs");
    expect(container.querySelectorAll(".library-card")).toHaveLength(1);
  });
});
