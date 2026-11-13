import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import type * as T_activities from "@sendtally/features/activities";
import type * as T_logSession from "@sendtally/features/log-session";
import type * as T_statistics from "@sendtally/features/statistics";
import type { WorkoutRun } from "@sendtally/features/workouts";
import { liveRunOf } from "../../lib/useLiveRun";
import { SetsPage } from "../../training/players/SetsPage";
import { TallyPage } from "./TallyPage";
import type * as T_useLibrary from "../../training/library/useLibrary";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute("open", "");
};

vi.mock("@clerk/react-router", () => ({ useAuth: () => ({ userId: "u1" }) }));
vi.mock("../../lib/useAppApi", () => ({
  useAppApi: () => ({
    gyms: async () => ({ gyms: [] }),
    climbs: async () => ({ climbs: [] }),
    sessions: async () => ({ sessions: [], hangSessions: [], activities: [] }),
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
vi.mock("../../training/library/useLibrary", async (actual) => ({
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
        { name: "Core circuit", kind: "strength", measure: "reps", eachSide: false },
      ],
    },
  }),
}));
vi.mock("@sendtally/features/activities", async (actual) => ({
  ...(await actual<typeof T_activities>()),
  useWeightUnit: () => "kg",
  useActivities: () => ({ state: { status: "ready", data: [] } }),
}));

const run: WorkoutRun = {
  kind: "climbing",
  title: "Power endurance",
  date: "2026-11-04",
  workoutId: "w1",
  link: { membershipId: null, week: null, focus: null },
  minutes: 60,
  exerciseRestS: 0,
  items: [
    { exercise: "4x4s", dose: { sets: 2, reps: 2, setRestS: 240 } },
    { exercise: "Core circuit", dose: { sets: 1, reps: 10 } },
  ],
};

const { store, tally } = liveRunOf("u1");
let container: HTMLDivElement;
let root: Root;

function Where(): React.ReactElement {
  const { pathname, search } = useLocation();
  return <span data-testid="where">{`${pathname}${search}`}</span>;
}

async function mount(): Promise<void> {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/app/plan", "/app/workout/sets"]} initialIndex={1}>
          <Routes>
            <Route path="/app/workout/sets" element={<SetsPage run={run} end={false} />} />
            <Route path="/app/workout/tally" element={<TallyPage exercise />} />
            <Route path="*" element={<Where />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )
  );
  await act(async () => new Promise((r) => setTimeout(r, 0)));
}

const button = (label: string): HTMLButtonElement =>
  Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
    (b) => b.textContent === label || b.getAttribute("aria-label") === label
  )!;
const text = (selector: string): string | null | undefined =>
  container.querySelector(selector)?.textContent;
const click = async (label: string): Promise<void> => {
  await act(async () => button(label).click());
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

describe("The tally in exercise mode", () => {
  it("logs a climbing exercise set by set, rests between, and hands its climbs to the player", async () => {
    await mount();
    expect(text(".player-dose")).toBe("2 sets of 2 climbs");
    await click("Start");
    expect(text(".tally-summary")).toBe("4x4s · Set 1 of 2 · 0 of 2 climbs");
    await click("V4");
    await click("Sent");
    await click("V3");
    await click("Fell");
    expect(text(".tally-time")).toBe("Rest 4:00");
    expect(text(".tally-summary")).toBe("4x4s · Set 2 of 2 next");
    await click("+30s");
    expect(text(".tally-time")).toBe("Rest 4:30");
    await click("V5");
    expect(container.querySelector(".tally-rest-actions")).toBeNull();
    await click("Sent");
    expect(text(".tally-summary")).toBe("4x4s · Set 2 of 2 · 1 of 2 climbs");

    await click("Done");
    act(() => root.unmount());
    root = createRoot(container);
    await mount();
    expect(text(".player-last")).toBe("3 climbs · 2 sent · top V5");
    expect(button("Resume")).toBeUndefined();
    await act(async () =>
      (container.querySelector('[aria-label="Core circuit, set 1"]') as HTMLInputElement).click()
    );
    await click("Finish");
    const where = new URL(`http://x${text("[data-testid=where]")}`);
    expect(where.pathname).toBe("/app/activity/new");
    expect(JSON.parse(where.searchParams.get("done") ?? "")).toEqual([
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
          { climbs: [{ grade: "V5", scale: "v", tries: 1, sent: true, style: "flash" }] },
        ],
      },
      { item: 1, exercise: "Core circuit", sets: [{ reps: 10 }] },
    ]);
  });
});
