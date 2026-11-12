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
    act(() =>
      root.render(
        <RangeChips member shown="all" onPick={() => {}} years={[2026, 2025]} onLocked={() => {}} />
      )
    );
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

  it("locks every range but the free one for a non-member and opens membership instead", () => {
    const onPick = vi.fn();
    const onLocked = vi.fn();
    act(() =>
      root.render(
        <RangeChips member={false} shown="7d" onPick={onPick} years={[]} onLocked={onLocked} />
      )
    );
    const all = chips()[0]!;
    expect(all.getAttribute("aria-label")).toBe("All, members only");
    act(() => all.click());
    expect(onLocked).toHaveBeenCalledOnce();
    act(() =>
      chips()
        .find((c) => c.textContent === "7D")
        ?.click()
    );
    expect(onPick).toHaveBeenCalledWith("7d");
  });
});
