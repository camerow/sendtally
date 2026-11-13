import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import type { Activity, JournalEntry } from "@sendtally/api-client";
import { logItems, logSegmentItems } from "@sendtally/features/journal";
import { TrainingLog } from "./TrainingLog";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute("open", "");
};

const activity = (id: string, title: string, date: string, workoutId: string | null): Activity =>
  ({
    id,
    kind: "strength",
    title,
    date,
    startTime: "18:00",
    minutes: 45,
    rpe: 6,
    notes: "",
    workoutId,
    stravaActivityId: null,
    done: [],
  }) as unknown as Activity;

const entry = (id: string, kind: JournalEntry["kind"], title: string, at: string): JournalEntry =>
  ({
    id,
    kind,
    title,
    body: "",
    occurred_at: at,
    ends_at: null,
    tags: [],
    severity: kind === "injury" ? 3 : null,
    status: null,
    parent_id: null,
    fingerprints: [],
  }) as unknown as JournalEntry;

const ITEMS = logSegmentItems(
  logItems(
    [],
    [
      entry("j1", "journal", "Rest week", "2026-11-08"),
      entry("i1", "injury", "Tweaked finger", "2026-10-02"),
    ],
    [],
    [
      activity("a1", "Pull day", "2026-11-10", "w-pull"),
      activity("a2", "Pull day", "2026-10-20", "w-pull"),
      activity("a3", "Mobility", "2026-11-03", null),
    ]
  ),
  "training"
);

let container: HTMLDivElement;
let root: Root;
const onClear = vi.fn();

function mount(workout: string | null = null, items = ITEMS): void {
  act(() =>
    root.render(
      <MemoryRouter>
        <TrainingLog items={items} workout={workout} onClearWorkout={onClear} />
      </MemoryRouter>
    )
  );
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const titles = (): string[] =>
  Array.from(container.querySelectorAll(".log-row-title-text")).map((n) => n.textContent ?? "");
const button = (label: string): HTMLButtonElement =>
  Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
    (b) => b.textContent === label || b.getAttribute("aria-label") === label
  )!;

describe("TrainingLog", () => {
  it("lists workouts and entries by month, each opening its page, with a chip per month", () => {
    mount();
    expect(titles()).toEqual(["Pull day", "Rest week", "Mobility", "Pull day", "Tweaked finger"]);
    expect(container.querySelector('a[href="/app/activity/a1"]')).not.toBeNull();
    expect(container.querySelectorAll(".scope-chip").length).toBeGreaterThanOrEqual(2);
  });

  it("narrows to the journal from the filter sheet, applied with its count", () => {
    mount();
    act(() => button("Filters").click());
    act(() => button("Journal").click());
    act(() => button("Show 2 entries").click());
    expect(titles()).toEqual(["Rest week", "Tweaked finger"]);
    expect(button("Filters").getAttribute("aria-pressed")).toBe("true");
  });

  it("narrows to one workout by its key, named on a pill that clears it", () => {
    mount("w-pull");
    expect(titles()).toEqual(["Pull day", "Pull day"]);
    act(() => container.querySelector<HTMLButtonElement>(".workout-filter-pill")!.click());
    expect(onClear).toHaveBeenCalled();
  });

  it("shows the empty state with Journal and Injury before anything is logged", () => {
    mount(null, []);
    const hrefs = Array.from(container.querySelectorAll(".log-empty a")).map(
      (a) => a.getAttribute("href")?.split("&")[0]
    );
    expect(hrefs).toEqual(["/app/journal/new?kind=journal", "/app/journal/new?kind=injury"]);
  });
});
