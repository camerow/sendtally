import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import type * as T_activities from "@sendtally/features/activities";
import type * as T_logSession from "@sendtally/features/log-session";
import type * as T_statistics from "@sendtally/features/statistics";
import { runParams, type WorkoutRun } from "@sendtally/features/workouts";
import {
  newTallyClimb,
  startExercise,
  withExerciseClimb,
  writeStoredDraft,
} from "@sendtally/features/log-session";
import { ToastProvider } from "../../components/Toast";
import { liveRunOf } from "../../lib/useLiveRun";
import { SetsPage } from "./SetsPage";
import type * as T_useLibrary from "../library/useLibrary";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute("open", "");
};

vi.mock("@clerk/react-router", () => ({ useAuth: () => ({ userId: "u1" }) }));
vi.mock("../../lib/useAppApi", () => ({
  useAppApi: () => ({
    gyms: async () => ({ gyms: [] }),
    climbs: async () => ({ climbs: [] }),
    sessions: async () => ({ sessions: [], hangSessions: [], hangParts: [], activities: [] }),
    status: () => new Promise(() => undefined),
  }),
}));
vi.mock("@sendtally/features/log-session", async (actual) => ({
  ...(await actual<typeof T_logSession>()),
  useLocalSessions: () => ({ save: vi.fn(), remove: vi.fn() }),
}));
vi.mock("../../lib/tones", () => ({ playTone: vi.fn() }));
vi.mock("@sendtally/features/settings", () => ({
  useGradeScalePrefs: () => ({ scales: { boulder: "v", route: "yds" }, ready: true }),
  useDisplayScales: () => ({ boulder: "v", route: "yds" }),
}));
vi.mock("../library/useLibrary", async (actual) => ({
  ...(await actual<typeof T_useLibrary>()),
  useLibrary: () => ({ state: { status: "loading" } }),
}));
vi.mock("@sendtally/features/statistics", async (actual) => ({
  ...(await actual<typeof T_statistics>()),
  useExercises: () => ({
    state: {
      status: "ready",
      data: [
        { name: "4x4s", kind: "climbing", measure: "reps", eachSide: false },
        { name: "Circuit laps", kind: "climbing", measure: "laps", eachSide: false },
        { name: "ARC", kind: "climbing", measure: "seconds", eachSide: false },
      ],
    },
  }),
}));
vi.mock("@sendtally/features/activities", async (actual) => ({
  ...(await actual<typeof T_activities>()),
  useWeightUnit: () => "kg",
  useActivities: () => ({ state: { status: "ready", data: [] } }),
}));

const runOf = (exercise: string, dose: WorkoutRun["items"][number]["dose"]): WorkoutRun => ({
  kind: "climbing",
  title: "Power endurance",
  date: "2026-11-17",
  workoutId: "w1",
  link: { membershipId: null, week: null, focus: null },
  session: 0,
  minutes: 60,
  exerciseRestS: 0,
  items: [{ exercise, dose }],
});

const { store, tally } = liveRunOf("u1");
let container: HTMLDivElement;
let root: Root;

function Where(): React.ReactElement {
  const { pathname, search } = useLocation();
  return <span data-testid="where">{`${pathname}${search}`}</span>;
}

async function mount(run: WorkoutRun): Promise<void> {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <ToastProvider>
          <MemoryRouter initialEntries={["/app/plan", "/app/workout/sets"]} initialIndex={1}>
            <Routes>
              <Route path="/app/workout/sets" element={<SetsPage run={run} end={false} />} />
              <Route path="*" element={<Where />} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    )
  );
  await act(async () => new Promise((r) => setTimeout(r, 0)));
}

const button = (label: string): HTMLButtonElement | undefined =>
  Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
    (b) => b.textContent === label || b.getAttribute("aria-label") === label
  );
const byLabel = (label: string): HTMLElement | null =>
  container.querySelector<HTMLElement>(`[aria-label="${label}"]`);
const texts = (selector: string): string[] =>
  Array.from(container.querySelectorAll(selector)).map((e) => e.textContent ?? "");
const click = async (label: string): Promise<void> => {
  await act(async () => button(label)!.click());
};
const tick = async (label: string): Promise<void> => {
  await act(async () => byLabel(label)!.click());
};
const add = async (grade: string): Promise<void> => {
  const chip = [...container.querySelectorAll<HTMLButtonElement>(".climb-picker button")].find(
    (b) => b.textContent === grade
  );
  await act(async () => chip!.click());
};
const block = (name: string): Element =>
  [...container.querySelectorAll(".exercise-block")].find((c) => c.textContent?.includes(name))!;
const finished = async (): Promise<unknown> => {
  await click("Finish");
  const where = new URL(`http://x${container.querySelector("[data-testid=where]")?.textContent}`);
  return JSON.parse(where.searchParams.get("done") ?? "null");
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: new Date(2026, 10, 17, 18, 0) });
  store.clear();
  tally.remove();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  vi.useRealTimers();
  act(() => root.unmount());
  container.remove();
  store.clear();
  tally.remove();
});

describe("Climbing inside the workout", () => {
  it("adds a row per climb, steps its attempts, ticks it sent, and ends the set only on End set", async () => {
    await mount(runOf("4x4s", { sets: 2, reps: 2, setRestS: 240 }));
    expect(texts(".player-gym")).toEqual(["No gym"]);
    await add("V5");
    for (let i = 0; i < 2; i++) await click("Increase Climb 1, V5 · Attempts");
    await tick("Climb 1, V5, Sent");
    expect(byLabel("Climb 1, V5, Sent")).toHaveProperty("checked", true);
    for (const g of ["V6", "V4", "V6"]) await add(g);
    expect(byLabel("Rest, 4:00 left")).toBeNull();
    await click("Climb 4, V6");
    await click("Remove V6");
    expect(byLabel("Climb 4, V6")).toBeNull();
    await click("End set 1");
    expect(byLabel("Rest, 4:00 left")).not.toBeNull();
    expect(texts(".climb-line")).toContain("3 attempts · sent");
    const done = (await finished()) as { sets: { climbs: unknown[] }[] }[];
    expect(done[0]?.sets[0]?.climbs).toEqual([
      { grade: "V5", scale: "v", tries: 3, sent: true, style: "redpoint" },
      { grade: "V6", scale: "v", tries: 1, sent: false },
      { grade: "V4", scale: "v", tries: 1, sent: false },
    ]);
  });

  it("adds a climb from the keyboard: type in the grade field, arrow, Enter", async () => {
    await mount(runOf("4x4s", { sets: 1, reps: 2 }));
    const field = container.querySelector<HTMLInputElement>('input[aria-label="Grade"]')!;
    await act(async () => field.focus());
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(field, "v1");
      field.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const key = (k: string) =>
      act(async () => field.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true })));
    await key("ArrowDown");
    await key("Enter");
    expect(byLabel("Climb 1, V10, Sent")).not.toBeNull();
    expect(field.value).toBe("");
  });

  it("names a climb from the selected row's edit control", async () => {
    await mount(runOf("4x4s", { sets: 1, reps: 2 }));
    await add("V5");
    expect(button("Edit climb")?.hidden).toBe(true);
    await click("Climb 1, V5");
    await click("Edit climb");
    expect(document.querySelector("dialog[open]")).not.toBeNull();
  });

  it("picks up a run left on the old tally with its climbs where they were", async () => {
    let draft = startExercise(
      null,
      { item: 0, name: "4x4s", sets: 2, climbs: 2, restS: 240 },
      new Date()
    );
    const climbed = newTallyClimb(draft, { kind: "grade", scale: "v", grade: "V7" }, "sent");
    draft = withExerciseClimb(climbed.draft, climbed.key);
    writeStoredDraft(tally, draft, new Date());
    const run = runOf("4x4s", { sets: 2, reps: 2, setRestS: 240 });
    store.writeAsIs({
      title: run.title,
      workoutId: run.workoutId,
      pathname: "/workout/sets",
      params: runParams(run),
      startedAt: Date.now() - 300_000,
      state: { player: "sets", done: [{ item: 0, exercise: "4x4s", sets: [{}, {}] }], ticked: [] },
    });
    await mount(run);
    expect(byLabel("Climb 1, V7, Sent")).toHaveProperty("checked", true);
  });

  it("runs a time set's clock only from its own button", async () => {
    await mount(runOf("ARC", { sets: 2, onS: 60, setRestS: 30 }));
    await add("V1");
    expect(byLabel("On the wall 0:00 of 1:00")).not.toBeNull();
    await click("Start");
    expect(button("Pause")).toBeDefined();
    await click("Pause");
    expect(button("Start")).toBeDefined();
  });

  it("logs a lap Sent, an Attempt lap as far as it got, and takes back a lap with its −", async () => {
    await mount(runOf("Circuit laps", { sets: 2, reps: 40 }));
    await click("Sent");
    await click("Attempt");
    for (let i = 0; i < 3; i++) await click("More moves");
    expect(texts(".lap-step-value")).toEqual(["3/40"]);
    await click("Save");
    await act(async () =>
      container.querySelector<HTMLButtonElement>("button.player-card--folded")!.click()
    );
    await click("Add lap");
    expect(texts(".climb-line")).toEqual(["40 moves", "3 moves"]);
    await click("3");
    await click("Remove lap 3");
    expect(button("Remove lap 3")).toBeUndefined();
    expect(document.body.textContent).toContain("Circuit laps · Lap 3 removed");
    await click("Undo");
    await click("3");
    await click("Remove lap 3");
    expect(await finished()).toEqual([
      { item: 0, exercise: "Circuit laps", sets: [{ reps: 40 }, { reps: 3 }] },
    ]);
  });

  it("finishes a circuit when its last lap still to climb is taken out, and keeps it finished", async () => {
    const run = runOf("Circuit laps", { sets: 3, reps: 40 });
    await mount({
      ...run,
      items: [...run.items, { exercise: "4x4s", dose: { sets: 1, reps: 2 } }],
    });
    await click("Sent");
    await click("Sent");
    await click("3");
    await click("Remove lap 3");
    expect(container.querySelector("button.player-card--folded")?.textContent).toContain(
      "Circuit laps"
    );
    await click("Undo");
    expect(container.querySelector("button.player-card--folded")).toBeNull();
    expect(texts(".climb-line")).toEqual(["40 moves", "40 moves"]);
  });

  it("never moves the tally from a click in a block; only the block's menu does", async () => {
    const two = runOf("4x4s", { sets: 2, reps: 2 });
    await mount({ ...two, items: [...two.items, { exercise: "ARC", dose: { sets: 1, onS: 60 } }] });
    await add("V4");
    await act(async () => (block("ARC") as HTMLElement).click());
    expect(block("ARC").querySelector(".climb-picker")).toBeNull();
    expect(block("4x4s").querySelector(".climb-picker")).not.toBeNull();
  });

  it("offers Climb this now only on a block the tally is not on", async () => {
    const one = runOf("4x4s", { sets: 1, reps: 1 });
    await mount({ ...one, items: [...one.items, { exercise: "ARC", dose: { sets: 1, onS: 60 } }] });
    await add("V4");
    const menuOf = async (name: string): Promise<string[]> => {
      await act(async () =>
        block(name)
          .querySelector<HTMLButtonElement>('[aria-label="More for this exercise"]')!
          .click()
      );
      return [...document.querySelectorAll('[role="menuitem"]')].map((m) => m.textContent ?? "");
    };
    expect(await menuOf("ARC")).toContain("Climb this now");
    await click("Climb this now");
    expect(await menuOf("ARC")).not.toContain("Climb this now");
  });

  it("moves the tally to a block from its menu", async () => {
    const two = runOf("4x4s", { sets: 1, reps: 2 });
    await mount({ ...two, items: [...two.items, { exercise: "ARC", dose: { sets: 1, onS: 60 } }] });
    await act(async () =>
      block("ARC")
        .querySelector<HTMLButtonElement>('[aria-label="More for this exercise"]')!
        .click()
    );
    await click("Climb this now");
    expect(block("ARC").querySelector(".climb-picker")).not.toBeNull();
  });
});
