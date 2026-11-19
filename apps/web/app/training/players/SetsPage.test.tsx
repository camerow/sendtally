import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import type * as T_activities from "@sendtally/features/activities";
import type * as T_statistics from "@sendtally/features/statistics";
import type { WorkoutRun } from "@sendtally/features/workouts";
import { ToastProvider } from "../../components/Toast";
import { liveRunOf } from "../../lib/useLiveRun";
import { SetsPage } from "./SetsPage";
import type * as T_useLibrary from "../library/useLibrary";
import type * as T_hang from "@sendtally/features/hang";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute("open", "");
};

vi.mock("@sendtally/features/hang", async (actual) => ({
  ...(await actual<typeof T_hang>()),
  useGrips: () => ({ isGrip: () => false, gripName: (id: string) => id }),
}));
vi.mock("@clerk/react-router", () => ({ useAuth: () => ({ userId: "u1" }) }));
vi.mock("../../lib/useAppApi", () => ({
  useAppApi: () => ({
    gyms: () => new Promise(() => undefined),
    climbs: () => new Promise(() => undefined),
    sessions: () => new Promise(() => undefined),
  }),
}));
vi.mock("@sendtally/features/settings", () => ({
  useGradeScalePrefs: () => ({ scales: { boulder: "v", route: "yds" }, ready: true }),
}));
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
const mine = vi.hoisted(() => ({ exercises: [] as unknown[] }));

vi.mock("@sendtally/features/statistics", async (actual) => ({
  ...(await actual<typeof T_statistics>()),
  useExercises: () => ({ state: { status: "ready", data: mine.exercises } }),
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
  session: 0,
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

function mount(shown: WorkoutRun = run): void {
  act(() =>
    root.render(
      <QueryClientProvider client={new QueryClient()}>
        <ToastProvider>
          <MemoryRouter initialEntries={["/app/plan", "/app/workout/sets"]} initialIndex={1}>
            <Routes>
              <Route path="/app/workout/sets" element={<SetsPage run={shown} end={false} />} />
              <Route path="*" element={<Where />} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    )
  );
}

const byLabel = (label: string): HTMLElement | null =>
  document.querySelector<HTMLElement>(`[aria-label="${label}"]`) ??
  Array.from(document.querySelectorAll("label")).find((l) => l.textContent === label)?.control ??
  null;
const button = (text: string): HTMLButtonElement =>
  Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
    (b) => b.textContent === text
  )!;
const texts = (selector: string): string[] =>
  Array.from(container.querySelectorAll(selector)).map((e) => e.textContent ?? "");
const loggedOrder = (): string[] => {
  act(() => button("Finish").click());
  const where = new URL(`http://x${document.querySelector("[data-testid=where]")?.textContent}`);
  return (JSON.parse(where.searchParams.get("done") ?? "[]") as { exercise: string }[]).map(
    (d) => d.exercise
  );
};
const removeSecondSquat = (): void => {
  act(() => (byLabel("Back squat, set 1") as HTMLInputElement).click());
  act(() => byLabel("Back squat, set 2")?.closest<HTMLElement>(".set-row")?.click());
  act(() => (byLabel("Remove set 2") as HTMLButtonElement).click());
};
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
  mine.exercises = [];
  act(() => root.unmount());
  container.remove();
  store.clear();
  vi.useRealTimers();
});

describe("Sets player", () => {
  it("adds a set to any exercise, and takes the current one out with Undo", () => {
    mount();
    act(() => (byLabel("Add a set to Row") as HTMLButtonElement).click());
    expect(byLabel("Row, set 2")).not.toBeNull();
    act(() => (byLabel("Back squat, set 2") as HTMLInputElement).click());
    expect(document.querySelectorAll('[aria-label^="Remove set"]')).toHaveLength(1);
    act(() => (byLabel("Remove set 2") as HTMLButtonElement).click());
    expect(byLabel("Back squat, set 2")).toBeNull();
    expect(document.body.textContent).toContain("Back squat · Set 2 removed");
    act(() => button("Undo").click());
    expect((byLabel("Back squat, set 2") as HTMLInputElement).checked).toBe(true);
  });

  it("makes a set current on a tap in its row, not on a press that may start a scroll", () => {
    mount();
    const reps = byLabel("Back squat, set 2 · Reps") as HTMLElement;
    act(() => {
      reps.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    });
    expect(byLabel("Remove set 2")).toBeNull();
    act(() => reps.click());
    expect(byLabel("Remove set 2")).not.toBeNull();
  });

  it("says whether an exercise card is open", () => {
    mount();
    expect(byLabel("Fold Back squat")?.getAttribute("aria-expanded")).toBe("true");
    act(() => (byLabel("Fold Back squat") as HTMLButtonElement).click());
    expect(
      document.querySelector('[aria-label^="Open Back squat, "]')?.getAttribute("aria-expanded")
    ).toBe("false");
  });

  it("puts a removed set back on Undo without losing a tick made since", () => {
    mount();
    act(() => (byLabel("Back squat, set 2") as HTMLInputElement).click());
    act(() => (byLabel("Remove set 2") as HTMLButtonElement).click());
    act(() => (byLabel("Row, set 1") as HTMLInputElement).click());
    act(() => button("Undo").click());
    expect((byLabel("Back squat, set 2") as HTMLInputElement).checked).toBe(true);
    expect(document.querySelector('[aria-label^="Open Row, "]')).not.toBeNull();
  });

  it("keeps a card folded by hand when minimised and opened again", () => {
    mount();
    act(() => (byLabel("Fold Back squat") as HTMLButtonElement).click());
    act(() => root.unmount());
    root = createRoot(container);
    mount();
    expect(byLabel("Back squat, set 1")).toBeNull();
    expect(byLabel("Fold Back squat")).toBeNull();
  });

  it("logs exercises in the order they were finished", () => {
    mount();
    act(() => (byLabel("Row, set 1") as HTMLInputElement).click());
    act(() => (byLabel("Back squat, set 1") as HTMLInputElement).click());
    act(() => (byLabel("Back squat, set 2") as HTMLInputElement).click());
    act(() => button("Finish").click());
    const where = new URL(`http://x${document.querySelector("[data-testid=where]")?.textContent}`);
    expect(
      (JSON.parse(where.searchParams.get("done") ?? "[]") as { exercise: string }[]).map(
        (d) => d.exercise
      )
    ).toEqual(["Row", "Back squat", "Plank"]);
  });

  it("ends an exercise when its last unticked set is removed, in the order it ended", () => {
    mount();
    act(() => (byLabel("Row, set 1") as HTMLInputElement).click());
    removeSecondSquat();
    expect(loggedOrder()).toEqual(["Row", "Back squat", "Plank"]);
  });

  it("takes back that end when the removed set comes back on Undo", () => {
    mount();
    removeSecondSquat();
    act(() => button("Undo").click());
    act(() => (byLabel("Row, set 1") as HTMLInputElement).click());
    act(() => (byLabel("Back squat, set 2") as HTMLInputElement).click());
    expect(loggedOrder()).toEqual(["Row", "Back squat", "Plank"]);
  });

  it("skips an exercise to the end, moves and removes one, and logs them in that order", () => {
    mount();
    const more = (): HTMLButtonElement[] =>
      Array.from(
        document.querySelectorAll<HTMLButtonElement>('[aria-label="More for this exercise"]')
      );
    act(() => more()[0]!.click());
    act(() => button("Skip for now").click());
    expect(texts(".player-card-name")).toEqual(["Row", "Plank", "Back squat"]);
    expect(byLabel("Open Back squat, Skipped · tap to do it now")).not.toBeNull();
    act(() => more()[1]!.click());
    act(() => button("Move up").click());
    expect(texts(".player-card-name")).toEqual(["Plank", "Row", "Back squat"]);
    act(() => more()[0]!.click());
    act(() => button("Remove").click());
    act(() => button("Remove").click());
    expect(texts(".player-card-name")).toEqual(["Row", "Back squat"]);
    act(() => (byLabel("Row, set 1") as HTMLInputElement).click());
    act(() => button("Finish").click());
    const where = new URL(`http://x${document.querySelector("[data-testid=where]")?.textContent}`);
    expect(
      (JSON.parse(where.searchParams.get("done") ?? "[]") as { exercise: string }[]).map(
        (d) => d.exercise
      )
    ).toEqual(["Row", "Back squat"]);
    expect(where.searchParams.get("off")).toBe(JSON.stringify(["1:0", "1:1"]));
  });

  it("ticks a checklist's typed lines in any order and logs which were ticked", () => {
    const lines = ["Jog 5 min", "Arm circles x20", "Easy boulders x10"];
    mount({
      ...run,
      items: [{ exercise: "Checklist", dose: { sets: 3 }, checklist: { lines } }, run.items[1]!],
    });
    expect(texts(".player-card-name")[0]).toBe("Checklist");
    act(() => (byLabel("Easy boulders x10") as HTMLInputElement).click());
    act(() => (byLabel("Jog 5 min") as HTMLInputElement).click());
    expect((byLabel("Jog 5 min") as HTMLInputElement).checked).toBe(true);
    act(() => button("Finish").click());
    const where = new URL(`http://x${document.querySelector("[data-testid=where]")?.textContent}`);
    expect((JSON.parse(where.searchParams.get("done") ?? "[]") as unknown[])[0]).toEqual({
      item: 0,
      exercise: "Checklist",
      sets: [],
      checklist: { lines, checked: [0, 2] },
    });
  });

  it("runs a warm-up and a cool-down checklist around two exercises, counting the exercises only", () => {
    const warm = { exercise: "Checklist", dose: { sets: 1 }, checklist: { lines: ["Jog"] } };
    const cool = { exercise: "Checklist", dose: { sets: 1 }, checklist: { lines: ["Stretch"] } };
    mount({ ...run, items: [warm, run.items[1]!, run.items[2]!, cool] });
    expect(container.textContent).toContain("Exercise 1 of 2");
    act(() => (byLabel("Jog") as HTMLInputElement).click());
    act(() => (byLabel("Stretch") as HTMLInputElement).click());
    act(() => button("Finish").click());
    const where = new URL(`http://x${document.querySelector("[data-testid=where]")?.textContent}`);
    const done = JSON.parse(where.searchParams.get("done") ?? "[]") as {
      checklist?: { checked: number[] };
    }[];
    expect(done.flatMap((d) => (d.checklist === undefined ? [] : [d.checklist.checked]))).toEqual([
      [0],
      [0],
    ]);
  });

  it("shows no exercise counter on a run that is only a checklist", () => {
    mount({
      ...run,
      items: [{ exercise: "Checklist", dose: { sets: 1 }, checklist: { lines: ["Jog"] } }],
    });
    expect(container.textContent).not.toMatch(/Exercise \d/);
  });

  it("shows an exercise's own target under its name, and none where it sets none", () => {
    mount({
      ...run,
      items: [
        { exercise: "Back squat", dose: { sets: 2, reps: 5, targetRpe: 8 } },
        { exercise: "Row", dose: { sets: 1, reps: 8 } },
      ],
    });
    expect(texts(".player-card-meta")).toEqual(["Target RPE 8"]);
  });

  it("asks a ticked set's RPE only where the exercise sets a target, its target dim", () => {
    mount({
      ...run,
      items: [
        { exercise: "Back squat", dose: { sets: 2, reps: 5, targetRpe: 8 } },
        { exercise: "Row", dose: { sets: 1, reps: 8 } },
      ],
    });
    expect(texts(".set-row--head .set-col-rpe")).toEqual(["RPE"]);
    expect(byLabel("Back squat, set 1 · RPE")).toBeNull();
    act(() => (byLabel("Back squat, set 1") as HTMLInputElement).click());
    act(() => (byLabel("Row, set 1") as HTMLInputElement).click());
    expect((byLabel("Back squat, set 1 · RPE") as HTMLInputElement).placeholder).toBe("8");
    expect(byLabel("Row, set 1 · RPE")).toBeNull();
  });

  it("opens an exercise's description from the info button beside its name", () => {
    mine.exercises = [
      { id: "e1", name: "row", kind: "strength", description: "Pull to the hip." },
      { id: "e2", name: "Back squat", kind: "strength", description: "" },
    ];
    mount();
    const info = document.querySelectorAll('[aria-label="About this exercise"]');
    expect(info).toHaveLength(1);
    expect(info[0]?.closest(".player-card-title")?.textContent).toBe("Row");
    act(() => (info[0] as HTMLElement).click());
    expect(document.querySelector("dialog[open] .sheet-body")?.textContent).toBe(
      "Pull to the hip."
    );
  });

  it("shows each set's target and last time, with the rests still to come", () => {
    mount();
    expect(container.querySelector(".player-title")?.textContent).toBe("Lower body A");
    expect(container.querySelector(".player-target")?.textContent).toBe(
      "Exercise 1 of 3 · Target effort 8"
    );
    expect(texts(".desc-text")).toEqual(["Heavy squats, then rows."]);
    expect(byLabel("About this workout")).toBeNull();
    expect(texts(".set-previous")).toEqual(["Last 5 × 97.5", "Last 8 × 60"]);
    expect(document.querySelectorAll(".set-col-target .set-previous")).toHaveLength(0);
    expect(document.querySelectorAll(".set-row > .set-previous")).toHaveLength(2);
    expect(texts(".rest-preview")).toEqual(["Rest 1:30", "Rest 2:00", "Rest 2:00"]);
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
    const folded = "Open Back squat, 2 × 5 · 100 kg";
    expect(byLabel(folded)).not.toBeNull();
    expect(container.querySelector(".player-target")?.textContent).toBe(
      "Exercise 2 of 3 · Target effort 8"
    );
    expect(container.querySelector(".player-row-next [aria-hidden]")?.textContent).toBe("Row");
    expect(container.querySelector(".player-row-next .visually-hidden")?.textContent).toBe(
      "Next: Row"
    );
    act(() => (byLabel(folded) as HTMLButtonElement).click());
    expect(byLabel("Back squat, set 1")).not.toBeNull();
    act(() => (byLabel("Fold Back squat") as HTMLButtonElement).click());
    expect(byLabel("Back squat, set 1")).toBeNull();

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
    expect(byLabel("Open Plank, 1 × 30s")).not.toBeNull();
  });

  describe("a superset", () => {
    const group = { id: "s1", rounds: 2, restBetweenS: 0, restRoundS: 120 };
    const superset = {
      ...run,
      items: [
        { exercise: "Pull-ups", dose: { sets: 2, reps: 6 }, group },
        { exercise: "Push-ups", dose: { sets: 2, reps: 15 }, group },
        { exercise: "Plank", dose: { sets: 1, onS: 45 } },
      ],
    };
    const logged = (): { where: URL; done: { exercise: string; group?: unknown }[] } => {
      act(() => button("Finish").click());
      const where = new URL(
        `http://x${document.querySelector("[data-testid=where]")?.textContent}`
      );
      return { where, done: JSON.parse(where.searchParams.get("done") ?? "[]") };
    };

    it("runs round by round as one exercise, resting only after a round when the rest between is none", () => {
      mount(superset);
      expect(container.textContent).toContain("Superset · Round 1 of 2");
      expect(container.textContent).toContain("Exercise 1 of 2");
      act(() => (byLabel("Pull-ups, set 1") as HTMLInputElement).click());
      expect(container.querySelector(".player-row")).toBeNull();
      expect(container.textContent).toContain("Next: Push-ups");
      act(() => (byLabel("Push-ups, set 1") as HTMLInputElement).click());
      expect(container.textContent).toContain("Superset · Round 2 of 2");
      expect(container.querySelector(".player-row")).not.toBeNull();
    });

    it("adds a round to every member, and takes a round from every member with one Undo", () => {
      mount(superset);
      act(() => button("+ Add round").click());
      expect(byLabel("Push-ups, set 3")).not.toBeNull();
      act(() => byLabel("Pull-ups, set 3")?.closest<HTMLElement>(".set-row")?.click());
      act(() => (byLabel("Remove set 3") as HTMLButtonElement).click());
      expect(byLabel("Pull-ups, set 3")).toBeNull();
      expect(byLabel("Push-ups, set 3")).toBeNull();
      act(() => button("Undo").click());
      expect(byLabel("Pull-ups, set 3")).not.toBeNull();
      expect(byLabel("Push-ups, set 3")).not.toBeNull();
    });

    it("plays the member left as a plain exercise once the other is skipped", () => {
      mount(superset);
      act(() => (byLabel("More for this exercise") as HTMLButtonElement).click());
      act(() => button("Skip Push-ups for now").click());
      expect(container.textContent).not.toContain("Superset");
      expect(texts(".player-card-name")[0]).toBe("Pull-ups");
    });

    it("moves the superset whole from its menu", () => {
      mount(superset);
      act(() => (byLabel("More for this exercise") as HTMLButtonElement).click());
      act(() => button("Move down").click());
      const text = container.textContent ?? "";
      expect(text.indexOf("Plank")).toBeLessThan(text.indexOf("Superset · Round 1 of 2"));
    });

    it("never hides a card when one member is skipped, first or middle", () => {
      const three = {
        ...superset,
        items: [
          superset.items[0]!,
          superset.items[1]!,
          { exercise: "Rows", dose: { sets: 2, reps: 10 }, group },
          superset.items[2]!,
        ],
      };
      const shown = (): string[] =>
        ["Pull-ups", "Push-ups", "Rows", "Plank"].filter(
          (name) => byLabel(`${name}, set 1`) !== null || container.textContent?.includes(name)
        );
      for (const skip of ["Push-ups", "Pull-ups"]) {
        mount(three);
        act(() => (byLabel("More for this exercise") as HTMLButtonElement).click());
        act(() => button(`Skip ${skip} for now`).click());
        expect(shown()).toEqual(["Pull-ups", "Push-ups", "Rows", "Plank"]);
        for (const name of ["Pull-ups", "Push-ups", "Rows"]) {
          expect(
            byLabel(`${name}, set 1`) ?? container.querySelector(".player-card--folded")
          ).not.toBeNull();
        }
        act(() => root.unmount());
        root = createRoot(container);
        localStorage.clear();
      }
    });

    it("logs a half-done round as the sets done, each member with its superset", () => {
      mount(superset);
      act(() => (byLabel("Pull-ups, set 1") as HTMLInputElement).click());
      act(() => (byLabel("Push-ups, set 1") as HTMLInputElement).click());
      act(() => (byLabel("Pull-ups, set 2") as HTMLInputElement).click());
      const { where, done } = logged();
      expect(done.slice(0, 2).map((d) => d.group)).toEqual([
        { id: "s1", rounds: 2 },
        { id: "s1", rounds: 2 },
      ]);
      expect(where.searchParams.get("off")).toBe(JSON.stringify(["1:1", "2:0"]));
    });

    it("resumes a run reloaded mid-superset on the round it was on, its rest still running", () => {
      mount(superset);
      act(() => (byLabel("Pull-ups, set 1") as HTMLInputElement).click());
      act(() => (byLabel("Push-ups, set 1") as HTMLInputElement).click());
      advance(30_000);
      act(() => root.unmount());
      root = createRoot(container);
      mount(superset);
      expect(container.textContent).toContain("Superset · Round 2 of 2");
      expect(byLabel("Rest, 1:30 left")).not.toBeNull();
      expect((byLabel("Pull-ups, set 1") as HTMLInputElement).checked).toBe(true);
    });

    it("ends the run at its last tick in a superset when it sat open over 20 minutes after", () => {
      mount(superset);
      advance(10 * 60_000);
      act(() => (byLabel("Pull-ups, set 1") as HTMLInputElement).click());
      advance(2 * 60 * 60_000);
      const { where } = logged();
      expect(["minutes", "idle"].map((k) => where.searchParams.get(k))).toEqual(["10", "120"]);
    });
  });

  it("ends the run at its last tick when it sat open over 20 minutes after, across a minimise", () => {
    mount();
    advance(10 * 60_000);
    act(() => (byLabel("Row, set 1") as HTMLInputElement).click());
    act(() => root.unmount());
    root = createRoot(container);
    mount();
    advance(2 * 60 * 60_000);
    act(() => button("Finish").click());
    const where = new URL(`http://x${document.querySelector("[data-testid=where]")?.textContent}`);
    expect(["minutes", "endTime", "idle"].map((k) => where.searchParams.get(k))).toEqual([
      "10",
      "18:15",
      "120",
    ]);
  });

  it("keeps the whole clock when the only tick is taken back", () => {
    mount();
    advance(10 * 60_000);
    act(() => (byLabel("Back squat, set 1") as HTMLInputElement).click());
    act(() => (byLabel("Back squat, set 1") as HTMLInputElement).click());
    advance(2 * 60 * 60_000);
    act(() => button("Finish").click());
    const where = new URL(`http://x${document.querySelector("[data-testid=where]")?.textContent}`);
    expect(["minutes", "endTime", "idle"].map((k) => where.searchParams.get(k))).toEqual([
      "130",
      null,
      null,
    ]);
  });
});
