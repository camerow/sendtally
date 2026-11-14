import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import type { WorkoutDoneVM, WorkoutGroupVM } from "@sendtally/features/statistics";
import { WorkoutsDone } from "./WorkoutsDone";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const row = (key: string, name: string, total: number): WorkoutDoneVM => ({
  key,
  name,
  kind: "hangboard",
  meta: `${total} times`,
  sessions: [
    { id: `${key}-1`, dateLabel: "Sat, Nov 1", duration: "38m", rpe: "RPE 8" },
    { id: `${key}-2`, dateLabel: "Wed, Oct 29", duration: null, rpe: null },
  ],
  total,
});

const groups: WorkoutGroupVM[] = [
  {
    key: "hangboard",
    label: "Fingers",
    kind: "hangboard",
    rows: [row("max", "Max hangs", 14), row("rep", "Repeaters 7:3", 9)],
  },
];

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render(element: React.ReactElement): void {
  act(() => root.render(<MemoryRouter>{element}</MemoryRouter>));
}

const press = (label: string): void =>
  act(() => container.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)?.click());

const link = (text: string): HTMLAnchorElement | undefined =>
  [...container.querySelectorAll("a")].find((a) => a.textContent?.startsWith(text));

describe("Workouts done", () => {
  it("opens one workout at a time to its last sessions", () => {
    render(<WorkoutsDone groups={groups} picked={null} onClear={() => {}} />);
    expect(container.textContent).toContain("Workouts · most done first");
    expect(container.textContent).not.toContain("Sat, Nov 1");
    press("Max hangs, 14 times");
    expect(container.textContent).toContain("All 14 in Log");
    press("Repeaters 7:3, 9 times");
    expect(container.textContent).toContain("All 9 in Log");
    expect(container.textContent).not.toContain("All 14 in Log");
  });

  it("links a session to its activity page and the log narrowed to the workout", () => {
    render(<WorkoutsDone groups={groups} picked={null} onClear={() => {}} />);
    press("Max hangs, 14 times");
    expect(link("Sat, Nov 1")?.getAttribute("href")).toBe("/app/activity/max-1");
    expect(link("All 14 in Log")?.getAttribute("href")).toBe("/app?segment=training&workout=max");
  });

  it("names what the list is narrowed to, with a way to clear it", () => {
    const onClear = vi.fn();
    render(<WorkoutsDone groups={[]} picked="Power" onClear={onClear} />);
    expect(container.textContent).toContain("Workouts · Power");
    expect(container.textContent).toContain("No Power workouts in this range");
    act(() =>
      [...container.querySelectorAll("button")].find((b) => b.textContent === "Clear")?.click()
    );
    expect(onClear).toHaveBeenCalled();
  });

  it("says nothing with no workouts and nothing picked", () => {
    render(<WorkoutsDone groups={[]} picked={null} onClear={() => {}} />);
    expect(container.textContent).toBe("");
  });
});
