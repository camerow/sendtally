import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Segmented } from "./Segmented";

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

const radios = (): HTMLButtonElement[] =>
  Array.from(container.querySelectorAll<HTMLButtonElement>('[role="radio"]'));

describe("Segmented", () => {
  it("marks the chosen option and reports a click on another", () => {
    const onChange = vi.fn();
    act(() =>
      root.render(
        <Segmented
          label="View"
          options={[
            { value: "blocks", label: "Blocks" },
            { value: "workouts", label: "Workouts" },
          ]}
          value="blocks"
          onChange={onChange}
        />
      )
    );
    expect(radios().map((r) => r.getAttribute("aria-checked"))).toEqual(["true", "false"]);
    act(() => radios()[1]?.click());
    expect(onChange).toHaveBeenCalledWith("workouts");
  });

  it("sends a locked option to onLocked instead of choosing it", () => {
    const onChange = vi.fn();
    const onLocked = vi.fn();
    act(() =>
      root.render(
        <Segmented
          label="Range"
          options={[
            { value: "month", label: "Month" },
            { value: "year", label: "Year", locked: true },
          ]}
          value="month"
          onChange={onChange}
          onLocked={onLocked}
        />
      )
    );
    const locked = radios()[1]!;
    expect(locked.getAttribute("aria-label")).toBe("Year, members only");
    expect(locked.querySelector("svg")).not.toBeNull();
    act(() => locked.click());
    expect(onLocked).toHaveBeenCalledWith("year");
    expect(onChange).not.toHaveBeenCalled();
  });
});
