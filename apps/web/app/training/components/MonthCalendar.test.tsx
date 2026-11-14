import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MonthCalendar } from "./MonthCalendar";

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

describe("MonthCalendar", () => {
  it("steps through months and picks a day", () => {
    const onPick = vi.fn();
    act(() =>
      root.render(
        <MonthCalendar selected="2026-11-12" min={null} today="2026-11-12" onPick={onPick} />
      )
    );
    const title = (): string | null | undefined =>
      container.querySelector(".month-calendar-title")?.textContent;
    expect(title()).toMatch(/november/i);
    act(() => container.querySelector<HTMLButtonElement>('[aria-label="Next month"]')?.click());
    expect(title()).toMatch(/december/i);
    act(() =>
      Array.from(container.querySelectorAll<HTMLButtonElement>(".month-calendar-day"))
        .find((d) => d.textContent === "3")
        ?.click()
    );
    expect(onPick).toHaveBeenCalledWith("2026-12-03");
  });
});
