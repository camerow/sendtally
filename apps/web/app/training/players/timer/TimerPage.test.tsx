import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import type { HangWorkout } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import type * as T_training from "@sendtally/features/training";
import type * as T_workouts from "@sendtally/features/workouts";
import { liveRunStore, readDoneParams, type RunStorage } from "@sendtally/features/workouts";
import { WithHang } from "../../data/testHang";
import { TimerPage } from "./TimerPage";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute("open", "");
};

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

const lifts: HangWorkout = {
  id: "w1",
  source: "mine",
  grip: "bar",
  timeUnits: { hangS: "s", restS: "s", setRestS: "s" },
  name: "Weighted pull-ups",
  kind: "pull",
  hangS: 0,
  restS: 0,
  reps: 2,
  sets: 2,
  setRestS: 60,
};

vi.mock("../../../lib/useAppApi", () => ({ useAppApi: () => ({}) }));
vi.mock("../../../lib/useLiveRun", () => ({ useLiveRunStore: () => store }));
vi.mock("../../../lib/tones", () => ({ playTone: (s: string) => playTone(s) }));
vi.mock("../../library/useLibrary", () => ({
  useLibrary: () => ({ state: { status: "loading" }, reload: vi.fn() }),
}));
vi.mock("@sendtally/features/training", async (actual) => ({
  ...(await actual<typeof T_training>()),
  usePlan: () => ({ state: { status: "loading" } }),
}));
vi.mock("@sendtally/features/workouts", async (actual) => ({
  ...(await actual<typeof T_workouts>()),
  usePlannedRun: () => ({
    items: [{ workout: lifts, dose: { sets: 2, weightKg: 20 } }],
    exerciseRestS: 0,
  }),
}));

let container: HTMLDivElement;
let root: Root;

function Where(): React.ReactElement {
  const { pathname, search } = useLocation();
  return (
    <p data-testid="where" data-search={search}>
      {pathname}
    </p>
  );
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
      <WithHang>
        <MemoryRouter initialEntries={["/app/workout/timer"]}>
          <Routes>
            <Route
              path="/app/workout/timer"
              element={
                <TimerPage
                  workoutId="w1"
                  gripId="bar"
                  link={{ membershipId: null, week: null, focus: null }}
                  session={0}
                  end={false}
                />
              }
            />
            <Route path="*" element={<Where />} />
          </Routes>
        </MemoryRouter>
      </WithHang>
    )
  );
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

const button = (name: string): HTMLButtonElement => {
  const found = [...document.querySelectorAll("button")].find(
    (b) => b.textContent === name || b.getAttribute("aria-label") === name
  );
  if (found === undefined) throw new Error(`no ${name}`);
  return found;
};

const advance = (ms: number): void => act(() => void vi.advanceTimersByTime(ms));

describe("TimerPage", () => {
  it("counts in, then logs lifts with a tone, a dot each, and Missed lift beside", () => {
    expect(container.textContent).toContain(t("hang.phaseReady"));
    advance(5_100);
    expect(container.textContent).toContain("0/2");
    act(() => button(t("hang.lifted")).click());
    expect(playTone).toHaveBeenCalledWith("lift");
    expect(container.querySelectorAll(".timer-dot--ok")).toHaveLength(1);
    act(() => button(t("hang.missedLift")).click());
    expect(playTone).toHaveBeenCalledWith("miss");
  });

  it("changes the load for today from the setup pill", () => {
    act(() => button(t("hang.changeToday")).click());
    expect(document.querySelector("dialog[open]")?.textContent).toContain(t("hang.forToday"));
  });

  it("is quiet once muted", () => {
    act(() => button(t("hang.mute")).click());
    advance(5_100);
    expect(playTone).not.toHaveBeenCalled();
  });

  it("hands what it ran to the review once ended", () => {
    advance(5_100);
    act(() => button(t("hang.lifted")).click());
    act(() => button(t("hang.end")).click());
    const where = container.querySelector("[data-testid=where]");
    expect(where?.textContent).toBe("/app/workout/done");
    const params = readDoneParams(
      Object.fromEntries(new URLSearchParams(where?.getAttribute("data-search") ?? ""))
    );
    expect(params.workoutId).toBe("w1");
    expect(params.run?.done).toHaveLength(1);
    expect(params.run?.off).toEqual(["0:0", "0:1"]);
  });
});
