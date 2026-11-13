import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import type * as T_activities from "@sendtally/features/activities";
import type * as T_statistics from "@sendtally/features/statistics";
import type { WorkoutRun } from "@sendtally/features/workouts";
import { liveRunOf } from "../../lib/useLiveRun";
import { SetsPage } from "./SetsPage";
import type * as T_useLibrary from "../library/useLibrary";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute("open", "");
};

vi.mock("@clerk/react-router", () => ({ useAuth: () => ({ userId: "u1" }) }));
vi.mock("../../lib/useAppApi", () => ({ useAppApi: () => ({}) }));
vi.mock("../library/useLibrary", async (actual) => ({
  ...(await actual<typeof T_useLibrary>()),
  useLibrary: () => ({
    state: {
      status: "ready",
      data: {
        workout: () => ({
          id: "w1",
          kind: "strength",
          name: "Lower body A",
          description: "Heavy squats, then rows.",
          targetRpe: 8,
        }),
      },
    },
  }),
}));
vi.mock("@sendtally/features/statistics", async (actual) => ({
  ...(await actual<typeof T_statistics>()),
  useExercises: () => ({ state: { status: "ready", data: [] } }),
}));
vi.mock("@sendtally/features/activities", async (actual) => ({
  ...(await actual<typeof T_activities>()),
  useWeightUnit: () => "kg",
  useActivities: () => ({
    state: {
      status: "ready",
      data: [
        {
          workoutId: "w1",
          done: [
            { item: 0, exercise: "Back squat", sets: [{ reps: 5, weightKg: 97.5 }] },
            { item: 1, exercise: "Row", sets: [{ reps: 8, weightKg: 60 }] },
          ],
        },
      ],
    },
  }),
}));

const run: WorkoutRun = {
  kind: "strength",
  title: "Lower body A",
  date: "2026-10-22",
  workoutId: "w1",
  link: { membershipId: "m1", week: 2, focus: null },
  minutes: 45,
  exerciseRestS: 120,
  items: [
    { exercise: "Back squat", dose: { sets: 2, reps: 5, weightKg: 100, setRestS: 90 } },
    { exercise: "Row", dose: { sets: 1, reps: 8 } },
    { exercise: "Plank", dose: { sets: 1, onS: 30 } },
  ],
};

const { store } = liveRunOf("u1");
let container: HTMLDivElement;
let root: Root;

function Where(): React.ReactElement {
  const { pathname, search } = useLocation();
  return <span data-testid="where">{`${pathname}${search}`}</span>;
}

function mount(): void {
  act(() =>
    root.render(
      <MemoryRouter initialEntries={["/app/plan", "/app/workout/sets"]} initialIndex={1}>
        <Routes>
          <Route path="/app/workout/sets" element={<SetsPage run={run} end={false} />} />
          <Route path="*" element={<Where />} />
        </Routes>
      </MemoryRouter>
    )
  );
}

const byLabel = (label: string): HTMLElement | null =>
  document.querySelector<HTMLElement>(`[aria-label="${label}"]`);
const button = (text: string): HTMLButtonElement =>
  Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
    (b) => b.textContent === text
  )!;
const texts = (selector: string): string[] =>
  Array.from(container.querySelectorAll(selector)).map((e) => e.textContent ?? "");
const advance = (ms: number): void =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

beforeEach(() => {
  vi.useFakeTimers({ now: new Date(2026, 9, 22, 18, 5) });
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

describe("Sets player", () => {
  it("shows each set's target and last time, with the rests still to come", () => {
    mount();
    expect(container.querySelector(".player-title")?.textContent).toBe("Lower body A");
    expect(container.querySelector(".player-target")?.textContent).toBe("Target effort 8");
    expect(texts(".set-previous")).toEqual(["Last 5 × 97.5 kg", "Last 8 × 60 kg"]);
    expect(texts(".rest-preview")).toEqual(["Rest 1:30", "Rest 2:00", "Rest 2:00"]);
    act(() => (byLabel("About this workout") as HTMLButtonElement).click());
    expect(document.querySelector("dialog .sheet-body")?.textContent).toBe(
      "Heavy squats, then rows."
    );
  });

  it("rests in line after a tick, folds a finished exercise, and finishes to its review", () => {
    mount();
    act(() => (byLabel("Back squat, set 1") as HTMLInputElement).click());
    expect(byLabel("Rest, 1:30 left")).not.toBeNull();
    advance(30_000);
    expect(byLabel("Rest, 1:00 left")).not.toBeNull();
    act(() => button("Skip").click());
    expect(byLabel("Rest, 1:00 left")).toBeNull();
    act(() => (byLabel("Back squat, set 2") as HTMLInputElement).click());
    expect(byLabel("Back squat, 2 of 2 sets")).not.toBeNull();
    expect(container.querySelector(".player-row-next")?.textContent).toBe("Next: Row");
    act(() => (byLabel("Back squat, 2 of 2 sets") as HTMLButtonElement).click());
    expect(byLabel("Back squat, set 1")).not.toBeNull();

    act(() => button("Finish").click());
    const where = new URL(`http://x${document.querySelector("[data-testid=where]")?.textContent}`);
    expect(where.pathname).toBe("/app/activity/new");
    expect(where.searchParams.get("live")).toBe("1");
    expect(where.searchParams.get("off")).toBe(JSON.stringify(["1:0", "2:0"]));
  });

  it("keeps its ticks and running rest when minimised and opened again", () => {
    mount();
    act(() => (byLabel("Back squat, set 1") as HTMLInputElement).click());
    act(() => root.unmount());
    root = createRoot(container);
    advance(30_000);
    mount();
    expect((byLabel("Back squat, set 1") as HTMLInputElement).checked).toBe(true);
    expect(byLabel("Rest, 1:00 left")).not.toBeNull();
  });

  it("times a timed set in its row after a count-in, and ticks it at its target", () => {
    mount();
    act(() => (byLabel("Back squat, set 1") as HTMLInputElement).click());
    act(() => (byLabel("Back squat, set 2") as HTMLInputElement).click());
    act(() => (byLabel("Row, set 1") as HTMLInputElement).click());
    act(() => button("Skip").click());
    act(() => (byLabel("Start Plank, 0:30") as HTMLButtonElement).click());
    expect(container.querySelector(".player-row-word")?.textContent).toBe("Ready");
    advance(3_000);
    advance(10_000);
    expect(container.querySelector(".player-row--hold .player-row-clock")?.textContent).toBe(
      "0:10"
    );
    advance(21_000);
    expect(container.querySelector(".player-row--hold")).toBeNull();
    expect(byLabel("Plank, 1 of 1 set")).not.toBeNull();
  });
});
