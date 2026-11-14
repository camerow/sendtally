import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import type { WorkoutRecord } from "@sendtally/api-client";
import { libraryOf, type WorkoutLibrary as Library } from "@sendtally/features/workouts";
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

vi.mock("./useLibrary", async (actual) => ({
  ...(await actual<typeof T_useLibrary>()),
  useLibrary: () => ({ state: { status: "ready", data: library() }, reload: vi.fn() }),
}));
vi.mock("../data/HangDataContext", () => ({
  useHangData: () => ({
    model: { gripName: (id: string) => id, defaultGrip: () => "", workout: () => undefined },
  }),
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const mount = (node: React.ReactNode): void =>
  act(() => root.render(<MemoryRouter>{node}</MemoryRouter>));

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
    expect(cards[0]?.textContent).toContain("Used 2 times");
    search("zzzz");
    expect(container.querySelector(".dashed-panel")).not.toBeNull();
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
