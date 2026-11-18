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
vi.mock("@sendtally/features/settings", () => ({
  useGradeScalePrefs: () => ({ scales: { boulder: "v", route: "yds" }, ready: true }),
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
const log = async (grade: string, go: "Attempt" | "Sent"): Promise<void> => {
  await click(grade);
  await click(go);
};
const finished = async (): Promise<unknown> => {
  await click("Finish");
  const where = new URL(`http://x${container.querySelector("[data-testid=where]")?.textContent}`);
  return JSON.parse(where.searchParams.get("done") ?? "null");
};

beforeEach(() => {
  store.clear();
  tally.remove();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  store.clear();
  tally.remove();
});

describe("Climbing inside the workout", () => {
  it("logs each climb in its set's row, flips one pressed wrong, and rests in place after the set", async () => {
    await mount(runOf("4x4s", { sets: 2, reps: 2, setRestS: 240 }));
    expect(texts(".climb-col").at(-1)).toBe("Climbs · 2 per set");
    expect(texts(".player-gym")).toEqual(["No gym"]);
    expect(texts(".climb-note")).toEqual(["2 climbs", "2 climbs"]);
    await log("V4", "Sent");
    expect(texts(".climb-note")[0]).toBe("1 of 2 climbs");
    await click("V4, Sent, tap to mark as attempt");
    expect(byLabel("V4, Attempt, tap to mark as sent")).not.toBeNull();
    await click("V4, Attempt, tap to mark as sent");
    await log("V3", "Attempt");
    expect(byLabel("Rest, 4:00 left")).not.toBeNull();
    expect(await finished()).toEqual([
      {
        item: 0,
        exercise: "4x4s",
        sets: [
          {
            climbs: [
              { grade: "V4", scale: "v", tries: 1, sent: true, style: "flash" },
              { grade: "V3", scale: "v", tries: 1, sent: false },
            ],
          },
        ],
      },
    ]);
  });

  it("takes a typed grade as well as a clicked one", async () => {
    await mount(runOf("4x4s", { sets: 1, reps: 2 }));
    const input = container.querySelector<HTMLInputElement>(".climb-type")!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "v6");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () =>
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
    );
    await click("Sent");
    expect(byLabel("V6, Sent, tap to mark as attempt")).not.toBeNull();
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
    expect(byLabel("V7, Sent, tap to mark as attempt")).not.toBeNull();
    expect(texts(".climb-note")[0]).toBe("1 of 2 climbs");
  });

  it("logs a lap Sent, an Attempt lap as far as it got, and takes back a lap with its −", async () => {
    await mount(runOf("Circuit laps", { sets: 2, reps: 40 }));
    expect(texts(".climb-col").at(-1)).toBe("Moves · 40 a lap");
    await click("Sent");
    await click("Attempt");
    for (let i = 0; i < 3; i++) await click("More moves");
    expect(texts(".lap-step-value")).toEqual(["3/40"]);
    await click("Save");
    await act(async () =>
      container.querySelector<HTMLButtonElement>("button.player-card--folded")!.click()
    );
    await click("+ Add lap");
    expect(button("Remove lap 3")?.className).toBe("set-remove set-remove--run");
    await click("Remove lap 3");
    expect(button("Remove lap 3")).toBeUndefined();
    expect(document.body.textContent).toContain("Circuit laps · Lap 3 removed");
    await click("Undo");
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
    await click("Remove lap 3");
    expect(container.querySelector("button.player-card--folded")?.textContent).toContain(
      "Circuit laps"
    );
    expect(texts(".climb-col").at(-1)).toBe("Climbs · 2 per set");
    await click("Undo");
    expect(container.querySelector("button.player-card--folded")).toBeNull();
    expect(texts(".lap-value")).toEqual(["40", "40"]);
  });

  it("never moves the tally from a click in a row; only the card's menu does", async () => {
    const two = runOf("4x4s", { sets: 2, reps: 2 });
    await mount({ ...two, items: [...two.items, { exercise: "ARC", dose: { sets: 1, onS: 60 } }] });
    await log("V4", "Sent");
    const arc = () =>
      [...container.querySelectorAll(".player-card")].find((c) => c.textContent?.includes("ARC"))!;
    await act(async () =>
      arc().querySelector<HTMLElement>(".climb-row:not(.climb-row--head)")!.click()
    );
    expect(arc().querySelector(".climb-picker")).toBeNull();
    await click("V4, Sent, tap to mark as attempt");
    expect(byLabel("V4, Attempt, tap to mark as sent")).not.toBeNull();
  });

  it("offers Climb this now only on a card with climbing still to do", async () => {
    const one = runOf("4x4s", { sets: 1, reps: 1 });
    await mount({ ...one, items: [...one.items, { exercise: "ARC", dose: { sets: 1, onS: 60 } }] });
    await log("V4", "Sent");
    const card = (name: string) =>
      [...container.querySelectorAll(".player-card")].find((c) => c.textContent?.includes(name))!;
    await act(async () => (card("4x4s") as HTMLElement).click());
    const menuOf = async (name: string): Promise<string[]> => {
      await act(async () =>
        card(name)
          .querySelector<HTMLButtonElement>('[aria-label="More for this exercise"]')!
          .click()
      );
      return [...document.querySelectorAll('[role="menuitem"]')].map((m) => m.textContent ?? "");
    };
    expect(await menuOf("ARC")).toContain("Climb this now");
    await click("Climb this now");
    expect(await menuOf("4x4s")).not.toContain("Climb this now");
  });

  it("moves the tally to a card from its menu", async () => {
    const two = runOf("4x4s", { sets: 1, reps: 2 });
    await mount({ ...two, items: [...two.items, { exercise: "ARC", dose: { sets: 1, onS: 60 } }] });
    const arc = [...container.querySelectorAll(".player-card")].find((c) =>
      c.textContent?.includes("ARC")
    )!;
    await act(async () =>
      arc.querySelector<HTMLButtonElement>('[aria-label="More for this exercise"]')!.click()
    );
    await click("Climb this now");
    expect(
      container.querySelector(".climb-row--current")?.closest(".player-card")?.textContent
    ).toContain("ARC");
  });
});
