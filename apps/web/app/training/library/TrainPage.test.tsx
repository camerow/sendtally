import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router";
import { TrainPage } from "./TrainPage";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const access = vi.hoisted(() => ({ value: null as boolean | null }));
vi.mock("@sendtally/features/billing", () => ({
  useMembership: () => ({ access: access.value }),
}));
vi.mock("../../lib/useAppApi", () => ({ useAppApi: () => ({}) }));
vi.mock("@sendtally/features/exercises", async (actual) => ({
  ...(await actual<object>()),
  useExerciseList: () => [],
}));
vi.mock("../../components/AccountButton", () => ({ AccountButton: () => null }));
vi.mock("../data/HangDataProvider", () => ({
  HangDataProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("./WorkoutLibrary", () => ({ WorkoutLibrary: () => <p>workouts</p> }));
vi.mock("../blocks/BlocksList", () => ({ BlocksList: () => <p>blocks</p> }));
const newBlock = vi.hoisted(() => vi.fn());
vi.mock("../blocks/useNewBlock", () => ({ useNewBlock: () => newBlock }));
vi.mock("../exercises/ExerciseShelves", () => ({ ExerciseShelves: () => <p>exercises</p> }));

let container: HTMLDivElement;
let root: Root;
const at = { pathname: "", search: "" };

function Spy(): null {
  const { pathname, search } = useLocation();
  React.useEffect(() => {
    at.pathname = pathname;
    at.search = search;
  }, [pathname, search]);
  return null;
}

beforeEach(() => {
  access.value = null;
  newBlock.mockClear();
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
  it("opens on Blocks and keeps the chosen segment in the address", () => {
    mount("/app/train");
    expect(container.textContent).toContain("blocks");
    act(() => option("Workouts").click());
    expect(container.textContent).toContain("workouts");
    expect(at.search).toBe("?view=workouts");
    act(() => option("Blocks").click());
    expect(at.search).toBe("");
  });

  it("makes a new block from Create", () => {
    mount("/app/train");
    act(() => container.querySelector<HTMLElement>(".page-action")?.click());
    const row = [...document.querySelectorAll<HTMLElement>(".more-item")].find(
      (b) => b.textContent === "Create block"
    );
    act(() => row?.click());
    expect(newBlock).toHaveBeenCalled();
  });

  it("locks Create's three items without access, each opening Membership", () => {
    access.value = false;
    mount("/app/train");
    act(() => container.querySelector<HTMLElement>(".page-action")?.click());
    const items = [...document.querySelectorAll<HTMLElement>(".more-item")];
    expect(items.map((b) => b.getAttribute("aria-label"))).toEqual([
      "Create block, members only",
      "Create workout, members only",
      "Create exercise, members only",
    ]);
    expect(items.every((b) => b.querySelector(".lock") !== null)).toBe(true);
    act(() => items[0]?.click());
    expect(newBlock).not.toHaveBeenCalled();
    expect(`${at.pathname}${at.search}`).toBe("/app/membership?source=create");
  });

  it("lands on the segment a link names", () => {
    mount("/app/train?view=exercises");
    expect(option("Exercises").getAttribute("aria-checked")).toBe("true");
  });
});
