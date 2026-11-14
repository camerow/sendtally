import { afterEach, beforeEach, describe, expect, it } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { DaysClimbedVM } from "@sendtally/features/climbs";
import { DaysClimbing } from "./DaysClimbing";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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

const vm = (over: Partial<DaysClimbedVM>): DaysClimbedVM => ({
  weekdays: ["M", "", "W", "", "F", "", "S"],
  weeks: [],
  strip: [],
  outside: 1,
  gym: 2,
  label: "Days climbing",
  ...over,
});

describe("DaysClimbing", () => {
  it("draws a column of squares a week", () => {
    act(() =>
      root.render(
        <DaysClimbing
          vm={vm({
            weeks: [
              { month: "Nov", days: ["gym", "rest", "outside", "rest", "rest", "rest", "future"] },
            ],
          })}
        />
      )
    );
    expect(container.querySelectorAll(".days-weeks .days-square")).toHaveLength(7);
    expect(container.querySelector(".days-weeks .day-outside")).not.toBeNull();
    expect(container.textContent).toContain("Nov");
  });

  it("draws the 7D range as one row of big squares", () => {
    act(() => root.render(<DaysClimbing vm={vm({ strip: [{ weekday: "T", day: "gym" }] })} />));
    expect(container.querySelectorAll(".days-square--big")).toHaveLength(1);
    expect(container.querySelector(".days-weeks")).toBeNull();
  });
});
