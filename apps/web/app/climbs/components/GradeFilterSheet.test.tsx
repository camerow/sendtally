import { afterEach, beforeEach, describe, expect, it } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { ClimbSummary } from "@sendtally/api-client";
import { gradeFilterLabel, type GradeFilter } from "@sendtally/features/climbs";
import { GradeFilterSheet } from "./GradeFilterSheet";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute("open", "");
};

const climb = (id: string, value: number): ClimbSummary =>
  ({ id, grade: { scale: "v", value }, discipline: "boulder" }) as ClimbSummary;

const CLIMBS = [climb("a", 4), climb("b", 4), climb("c", 5), climb("d", 6), climb("e", 6)];

let container: HTMLDivElement;
let root: Root;
let seen: Array<GradeFilter | null>;

function Harness(): React.ReactElement {
  const [value, setValue] = React.useState<GradeFilter | null>(null);
  return (
    <GradeFilterSheet
      open
      value={value}
      scales={{ boulder: "v", route: "yds" }}
      climbs={CLIMBS}
      onChange={(next) => {
        seen.push(next);
        setValue(next);
      }}
      onClose={() => {}}
    />
  );
}

beforeEach(() => {
  seen = [];
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<Harness />));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const byLabel = (label: string): HTMLButtonElement =>
  container.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`)!;
const byText = (text: string): HTMLButtonElement =>
  Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(
    (b) => b.textContent === text
  )!;

describe("GradeFilterSheet", () => {
  it("picks one grade with a click and closes a range with a second", () => {
    act(() => byLabel("V6, 2 climbs").click());
    expect(seen.at(-1)).toEqual({ scale: "v", from: "V6", to: "V6" });
    expect(container.textContent).toMatch(/keep just V6/);
    act(() => byLabel("V4, 2 climbs").click());
    const range = seen.at(-1) ?? null;
    expect(range).toEqual({ scale: "v", from: "V4", to: "V6" });
    expect(range === null ? null : gradeFilterLabel(range)).toBe("V4 to V6");
    expect(byLabel("V5, 1 climb").getAttribute("aria-pressed")).toBe("true");
  });

  it("offers any grade, limit and volume presets below the bars", () => {
    act(() => byText("Limit · V4+").click());
    expect(seen.at(-1)).toEqual({ scale: "v", from: "V4", to: "V6" });
    act(() => byText("Any grade").click());
    expect(seen.at(-1)).toBeNull();
  });
});
