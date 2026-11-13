import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import type * as T_activities from "@sendtally/features/activities";
import type * as T_statistics from "@sendtally/features/statistics";
import type { WorkoutRun } from "@sendtally/features/workouts";
import { liveRunOf } from "../../lib/useLiveRun";
import { ChecklistPage } from "./ChecklistPage";
import type * as T_useLibrary from "../library/useLibrary";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@clerk/react-router", () => ({ useAuth: () => ({ userId: "u1" }) }));
vi.mock("../../lib/useAppApi", () => ({ useAppApi: () => ({}) }));
vi.mock("../library/useLibrary", async (actual) => ({
  ...(await actual<typeof T_useLibrary>()),
  useLibrary: () => ({ state: { status: "loading" } }),
}));
vi.mock("@sendtally/features/statistics", async (actual) => ({
  ...(await actual<typeof T_statistics>()),
  useExercises: () => ({ state: { status: "ready", data: [] } }),
}));
vi.mock("@sendtally/features/activities", async (actual) => ({
  ...(await actual<typeof T_activities>()),
  useWeightUnit: () => "kg",
}));

const run: WorkoutRun = {
  kind: "mobility",
  title: "Morning mobility",
  date: "2026-10-22",
  workoutId: "w2",
  link: { membershipId: null, week: null, focus: null },
  minutes: 15,
  exerciseRestS: 30,
  items: [
    { exercise: "Cat cow", dose: { sets: 1, reps: 10 } },
    { exercise: "Deep squat hold", dose: { sets: 1, onS: 20 } },
  ],
};

const { store } = liveRunOf("u1");
let container: HTMLDivElement;
let root: Root;

function Where(): React.ReactElement {
  const { pathname, search } = useLocation();
  return <span data-testid="where">{`${pathname}${search}`}</span>;
}

function mount(end = false): void {
  act(() =>
    root.render(
      <MemoryRouter initialEntries={["/app/workout/checklist"]}>
        <Routes>
          <Route path="/app/workout/checklist" element={<ChecklistPage run={run} end={end} />} />
          <Route path="*" element={<Where />} />
        </Routes>
      </MemoryRouter>
    )
  );
}

const box = (name: string): HTMLInputElement =>
  Array.from(container.querySelectorAll<HTMLLabelElement>(".check-row-main"))
    .find((l) => l.textContent?.startsWith(name))!
    .querySelector("input")!;
const byLabel = (label: string): HTMLElement | null =>
  container.querySelector<HTMLElement>(`[aria-label="${label}"]`);
const where = (): URL =>
  new URL(`http://x${container.querySelector("[data-testid=where]")?.textContent}`);

beforeEach(() => {
  vi.useFakeTimers({ now: new Date(2026, 9, 22, 7, 30) });
  store.clear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  store.clear();
  vi.useRealTimers();
});

describe("Checklist player", () => {
  it("ticks a line, rests before the next, and logs what was ticked", () => {
    mount();
    act(() => box("Cat cow").click());
    expect(container.querySelector(".check-row--ticked .check-row-name")?.textContent).toBe(
      "Cat cow"
    );
    expect(byLabel("Rest, 0:30 left")).not.toBeNull();
    expect(container.querySelector(".player-row-next")?.textContent).toBe("Next: Deep squat hold");
    expect(byLabel("Start Deep squat hold, 0:20")).not.toBeNull();
    act(() =>
      Array.from(container.querySelectorAll("button"))
        .find((b) => b.textContent === "Done for today")!
        .click()
    );
    expect(where().pathname).toBe("/app/activity/new");
    expect(where().searchParams.get("off")).toBe(JSON.stringify(["1:0"]));
  });

  it("finishes straight to its review when opened to Record it", () => {
    mount(true);
    expect(where().pathname).toBe("/app/activity/new");
  });
});
