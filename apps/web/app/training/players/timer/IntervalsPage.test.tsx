import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import type * as T_activities from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { liveRunStore, type IntervalsRun, type RunStorage } from "@sendtally/features/workouts";
import { IntervalsPage } from "./IntervalsPage";
import type * as T_useLibrary from "../../library/useLibrary";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const memory = (): RunStorage => {
  let value: string | null = null;
  return {
    read: () => value,
    write: (v) => (value = v),
    remove: () => (value = null),
    subscribe: () => () => undefined,
  };
};
const store = liveRunStore(memory(), { remove: () => undefined });
const playTone = vi.fn();

vi.mock("../../../lib/useAppApi", () => ({ useAppApi: () => ({}) }));
vi.mock("../../../lib/useLiveRun", () => ({ useLiveRunStore: () => store }));
vi.mock("../../../lib/tones", () => ({ playTone: (s: string) => playTone(s) }));
vi.mock("../../library/useLibrary", async (actual) => ({
  ...(await actual<typeof T_useLibrary>()),
  useLibrary: () => ({ state: { status: "loading" }, reload: vi.fn() }),
}));
vi.mock("@sendtally/features/activities", async (actual) => ({
  ...(await actual<typeof T_activities>()),
  useWeightUnit: () => "kg",
}));

const workout: IntervalsRun = {
  kind: "mobility",
  title: "Hip mobility flow",
  date: "2026-10-22",
  workoutId: "w1",
  link: { membershipId: null, week: null, focus: null },
  body: {
    rounds: 2,
    steps: [
      { label: "Couch stretch", measure: "time", seconds: 20, restAfter: 5, cue: "Squeeze" },
      { label: "Swing", measure: "count", count: 15, restAfter: 0 },
    ],
  },
};

let container: HTMLDivElement;
let root: Root;

function Where(): React.ReactElement {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

beforeEach(() => {
  vi.useFakeTimers({ now: new Date(2026, 9, 22, 18, 5) });
  store.storage.remove();
  playTone.mockClear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <MemoryRouter initialEntries={["/app/workout/intervals"]}>
        <Routes>
          <Route
            path="/app/workout/intervals"
            element={<IntervalsPage workout={workout} end={false} />}
          />
          <Route path="*" element={<Where />} />
        </Routes>
      </MemoryRouter>
    )
  );
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

const button = (name: string): HTMLButtonElement => {
  const found = [...container.querySelectorAll("button")].find(
    (b) => b.textContent === name || b.getAttribute("aria-label") === name
  );
  if (found === undefined) throw new Error(`no ${name}`);
  return found;
};

const advance = (ms: number): void => act(() => void vi.advanceTimersByTime(ms));

describe("IntervalsPage", () => {
  it("counts the step down after Get ready, with the round and what comes next", () => {
    expect(container.textContent).toContain(t("hang.phaseReady"));
    advance(5_100);
    expect(container.textContent).toContain("Couch stretch");
    expect(container.textContent).toContain(t("activities.roundOf", { round: 1, rounds: 2 }));
    expect(container.textContent).toContain(t("activities.upNext"));
    expect(playTone).toHaveBeenCalledWith("work");
  });

  it("pauses and resumes, and keeps the run on the live bar", () => {
    act(() => button(t("hang.pause")).click());
    expect(button(t("hang.resume"))).toBeDefined();
    expect(store.read()?.pathname).toBe("/workout/intervals");
  });

  it("goes to its review once ended", () => {
    advance(8_000);
    act(() => button(t("hang.end")).click());
    expect(container.querySelector("[data-testid=where]")?.textContent).toBe("/app/activity/new");
  });
});
