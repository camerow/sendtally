import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router";
import { TrainPage } from "./TrainPage";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("../../components/AccountButton", () => ({ AccountButton: () => null }));
vi.mock("../data/HangDataProvider", () => ({
  HangDataProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("./WorkoutLibrary", () => ({ WorkoutLibrary: () => <p>workouts</p> }));
vi.mock("../exercises/ExerciseShelves", () => ({ ExerciseShelves: () => <p>exercises</p> }));

let container: HTMLDivElement;
let root: Root;
const at = { search: "" };

function Spy(): null {
  const { search } = useLocation();
  React.useEffect(() => {
    at.search = search;
  }, [search]);
  return null;
}

beforeEach(() => {
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

const mount = (url: string): void =>
  act(() =>
    root.render(
      <MemoryRouter initialEntries={[url]}>
        <Spy />
        <TrainPage />
      </MemoryRouter>
    )
  );

const option = (label: string): HTMLElement =>
  [...container.querySelectorAll<HTMLElement>('[role="radio"]')].find(
    (b) => b.textContent === label
  )!;

describe("TrainPage", () => {
  it("opens on Workouts and keeps the chosen segment in the address", () => {
    mount("/app/train");
    expect(container.textContent).toContain("workouts");
    act(() => option("Exercises").click());
    expect(container.textContent).toContain("exercises");
    expect(at.search).toBe("?view=exercises");
  });

  it("lands on the segment a link names", () => {
    mount("/app/train?view=exercises");
    expect(option("Exercises").getAttribute("aria-checked")).toBe("true");
  });
});
