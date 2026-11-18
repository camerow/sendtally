import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import type { Activity, ClimbSummary, SessionRow, SessionWithClimbs } from "@sendtally/api-client";
import type * as Climbs from "@sendtally/features/climbs";
import type * as Training from "@sendtally/features/training";
import { LogPage } from "./LogPage";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute("open", "");
};

const session = (fingerprint: string, name: string, start: string): SessionRow =>
  ({
    fingerprint,
    board: null,
    source: "manual",
    location: "indoor",
    gym_id: null,
    area_id: null,
    name,
    start_at: start,
    end_at: start,
    times: "both",
    climb_count: 2,
    send_count: 1,
    top_grade: 5,
    top_send_grade: 3,
    top_grade_label: null,
    top_send_grade_label: null,
    notes: null,
    rpe: 6,
    rpe_source: "computed",
    title: "T",
    strava_activity_id: null,
    posted_at: null,
    post_state: null,
    post_error: null,
    membership_id: null,
    week: null,
    focus: null,
    tags: [],
  }) as SessionRow;

const climb = (id: string, name: string, v: number, sent: boolean): ClimbSummary => ({
  id,
  slug: id,
  name,
  grade: { scale: "v", value: v },
  discipline: "boulder",
  project: !sent,
  area_climb_id: null,
  area: null,
  sessions: 1,
  attempts: 2,
  sends: sent ? 1 : 0,
  first_at: "2026-11-10T18:00:00Z",
  last_at: "2026-11-10T18:00:00Z",
  sent_at: sent ? "2026-11-10T18:00:00Z" : null,
  notes: [],
});

const evening = session("s1", "Evening session", "2026-11-10T18:00:00Z");
const legDay: Activity = {
  id: "a1",
  kind: "strength",
  title: "Leg day",
  date: "2026-11-12",
  startTime: "18:30",
  minutes: 50,
  rpe: 7,
  notes: null,
  workoutId: null,
  membershipId: null,
  week: null,
  focus: null,
  done: [],
};

vi.mock("@clerk/react-router", () => ({
  useAuth: () => ({ userId: "u1" }),
  useUser: () => ({ user: null }),
}));
vi.mock("../../lib/useAppApi", () => ({ useAppApi: () => ({}) }));
vi.mock("../../live-session/useStartLiveSession", () => ({ useStartLiveSession: () => vi.fn() }));
vi.mock("@sendtally/features/gyms", () => ({ useGyms: () => ({ ready: false, gyms: [] }) }));
vi.mock("@sendtally/features/settings", () => ({
  useGradeScalePrefs: () => ({ scales: { boulder: "v", route: "yds" }, ready: true }),
  useDisplayScales: () => ({ boulder: "v", route: "yds" }),
}));
vi.mock("@sendtally/features/training", async (original) => ({
  ...(await original<typeof Training>()),
  useTrainingLog: () => ({
    log: { plan: { blocks: [], memberships: [] }, workout: () => undefined },
  }),
}));
vi.mock("@sendtally/features/climbs", async (original) => ({
  ...(await original<typeof Climbs>()),
  useClimbs: () => ({
    state: {
      status: "ready",
      data: {
        climbs: [climb("c1", "Crimp ladder", 5, false), climb("c2", "Slab", 3, true)],
        sessions: [
          {
            ...evening,
            climbs: [
              { name: "Crimp ladder", kind: "attempt", tries: 2, grade: { scale: "v", value: 5 } },
              { name: "Slab", kind: "send", tries: 1, grade: { scale: "v", value: 3 } },
            ],
          },
        ] as unknown as SessionWithClimbs[],
      },
    },
    reload: vi.fn(),
  }),
}));

let container: HTMLDivElement;
let root: Root;

function Where(): React.ReactElement {
  return <span data-testid="search">{useLocation().search}</span>;
}

function mount(at = "/app"): void {
  act(() =>
    root.render(
      <MemoryRouter initialEntries={[at]}>
        <Routes>
          <Route
            path="/app"
            element={
              <>
                <LogPage
                  status={null}
                  sessions={[evening]}
                  hangSessions={[]}
                  hangParts={[]}
                  activities={[legDay]}
                  entries={[]}
                />
                <Where />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    )
  );
}

const text = (): string => container.textContent ?? "";
const button = (name: string): HTMLButtonElement =>
  Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(
    (b) => b.getAttribute("aria-label") === name || b.textContent === name
  )!;
const search = (): string => container.querySelector('[data-testid="search"]')?.textContent ?? "";

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("LogPage", () => {
  it("lists climbing and training together, without the old switch", () => {
    mount();
    expect(text()).toContain("Evening session");
    expect(text()).toContain("Crimp ladder");
    expect(text()).toContain("Leg day");
    expect(container.querySelector('[role="radiogroup"]')).toBeNull();
  });

  it("searches from the bar, keeping the dated list, a session showing only the climb found", () => {
    mount();
    act(() => button("Search the Log").click());
    const input = container.querySelector<HTMLInputElement>('input[type="search"]')!;
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
        input,
        "slab"
      );
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(text()).toContain("Evening session");
    expect(text()).toContain("Slab");
    expect(text()).not.toContain("Crimp ladder");
    expect(text()).not.toContain("Leg day");
    act(() => button("Cancel").click());
    expect(text()).toContain("Leg day");
  });

  it("puts the sheet's filters in the link and drops one with its pill", () => {
    mount();
    act(() => button("Filters").click());
    act(() => button("Training").click());
    act(() => button("Show 1 session").click());
    expect(search()).toBe("?show=training");
    expect(text()).toContain("Leg day");
    expect(text()).not.toContain("Evening session");
    act(() => button("Training, Clear").click());
    expect(search()).toBe("");
  });

  it("lands on one row per climb from /app?status=projects", () => {
    mount("/app?status=projects");
    expect(text()).toContain("Crimp ladder");
    expect(text()).not.toContain("Slab");
    expect(text()).not.toContain("Evening session");
    expect(button("Projects, Clear")).toBeTruthy();
  });

  it("lands from a Stats link with its workout as a pill", () => {
    mount("/app?workout=title:leg%20day");
    expect(button("Leg day, Clear")).toBeTruthy();
    expect(text()).not.toContain("Evening session");
  });

  it("says nothing matches, under the bar that can undo it", () => {
    mount("/app?workout=nothing");
    expect(text()).toContain("Nothing matches.");
    expect(button("Filters")).toBeTruthy();
  });
});
