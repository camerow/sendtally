import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { RangeChips } from "./RangeChips";

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

const chips = (): HTMLButtonElement[] => Array.from(container.querySelectorAll("button"));

describe("RangeChips", () => {
  it("lists All, each year with data newest first, then the trailing ranges", () => {
    act(() => root.render(<RangeChips shown="all" onPick={() => {}} years={[2026, 2025]} />));
    expect(chips().map((c) => c.textContent)).toEqual([
      "All",
      "2026",
      "2025",
      "1Y",
      "6M",
      "3M",
      "1M",
      "7D",
    ]);
    expect(chips()[0]?.getAttribute("aria-pressed")).toBe("true");
  });

  it("opens every range for everyone, with no lock on any", () => {
    const onPick = vi.fn();
    act(() => root.render(<RangeChips shown="7d" onPick={onPick} years={[]} />));
    const all = chips()[0]!;
    expect(all.getAttribute("aria-label")).toBeNull();
    act(() => all.click());
    expect(onPick).toHaveBeenCalledWith("all");
  });
});
