import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { WorkoutWeeks, type WorkoutWeek } from "./WorkoutWeeks";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

let root: Root;
let host: HTMLDivElement;

const workouts: WorkoutWeek[] = [
  { id: "a", name: "Max hangs", kind: "hangboard", mine: false, days: [0] },
  { id: "b", name: "Pull day", kind: "strength", mine: true, days: [2] },
];

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe("WorkoutWeeks", () => {
  it("gives each workout its own seven days, and a day toggles that workout on it", () => {
    const onToggle = vi.fn();
    act(() =>
      root.render(
        <WorkoutWeeks workouts={workouts} meta="2 sessions" dim={[4]} onToggle={onToggle} />
      )
    );
    const buttons = [...host.querySelectorAll("button")];
    expect(buttons).toHaveLength(14);
    expect(buttons[2]?.getAttribute("aria-pressed")).toBe("false");
    expect(buttons[9]?.getAttribute("aria-pressed")).toBe("true");
    expect(buttons[11]?.style.opacity).toBe("0.45");
    act(() => buttons[11]?.click());
    expect(onToggle).toHaveBeenCalledWith("b", 4);
  });
});
