import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { TrainedFocusVM, TrainedKindVM } from "@sendtally/features/statistics";
import { TrainedMix } from "./TrainedMix";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const trained = [
  { kind: "hangboard", name: "Fingers", share: 3, detail: "3 · 1h 10m" },
  { kind: "strength", name: "Strength", share: 1, detail: "1 · 45m" },
] as unknown as TrainedKindVM[];
const byFocus = [
  { focus: "power", name: "Power", share: 4, detail: "4 · 1h 55m" },
] as unknown as TrainedFocusVM[];

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

const rowButtons = (): HTMLButtonElement[] => [
  ...container.querySelectorAll<HTMLButtonElement>(".mix-row"),
];

describe("TrainedMix", () => {
  it("picks a row as the filter and picks it again to clear", () => {
    const onPick = vi.fn();
    const render = (picked: string | null): void =>
      act(() =>
        root.render(
          <TrainedMix
            trained={trained}
            byFocus={byFocus}
            total="4 sessions"
            by="category"
            onBy={() => {}}
            picked={picked}
            onPick={onPick}
          />
        )
      );
    render(null);
    expect(rowButtons().map((b) => b.getAttribute("aria-label"))).toEqual([
      "Fingers, 3 · 1h 10m",
      "Strength, 1 · 45m",
    ]);
    act(() => rowButtons()[0]?.click());
    expect(onPick).toHaveBeenLastCalledWith("hangboard");
    render("hangboard");
    expect(rowButtons()[0]?.getAttribute("aria-pressed")).toBe("true");
    act(() => rowButtons()[0]?.click());
    expect(onPick).toHaveBeenLastCalledWith(null);
  });

  it("switches the rows to focus", () => {
    act(() =>
      root.render(
        <TrainedMix
          trained={trained}
          byFocus={byFocus}
          total="4 sessions"
          by="focus"
          onBy={() => {}}
          picked={null}
          onPick={() => {}}
        />
      )
    );
    expect(rowButtons().map((b) => b.textContent)).toEqual(["Power4 · 1h 55m"]);
  });
});
