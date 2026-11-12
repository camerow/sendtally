import { afterEach, beforeEach, describe, expect, it } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Pyramid } from "./Pyramid";

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

describe("Pyramid", () => {
  it("sizes each bar against the widest grade and splits what was not sent either side", () => {
    act(() =>
      root.render(
        <Pyramid
          label="pyramid"
          rows={[
            { gradeLabel: "V6", inner: 1, outer: 0, countLabel: "1" },
            { gradeLabel: "V5", inner: 2, outer: 2, countLabel: "2/4" },
          ]}
        />
      )
    );
    const bars = Array.from(container.querySelectorAll<HTMLElement>(".pyramid-bars"));
    const widths = (el: HTMLElement): string[] =>
      Array.from(el.children).map((c) => (c as HTMLElement).style.width);
    expect(widths(bars[0]!)).toEqual(["25%"]);
    expect(widths(bars[1]!)).toEqual(["25%", "50%", "25%"]);
    expect(container.querySelector('[role="img"]')?.getAttribute("aria-label")).toBe("pyramid");
  });
});
