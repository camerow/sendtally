import { afterEach, beforeEach, describe, expect, it } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { ImportSession } from "@sendtally/core/import";
import { DEFAULT_GRADE_SCALES } from "@sendtally/features/settings";
import { ImportSessionRow } from "./ImportSessionRow";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

let root: Root;
let host: HTMLDivElement;

const session = (over: Partial<ImportSession> = {}): ImportSession => ({
  date: "2024-10-14",
  location: "outdoor",
  climbs: [
    { name: "Roof", grade: { scale: "v", value: 9 }, kind: "send", tries: 2 },
    { name: "Arete", grade: { scale: "v", value: 11 }, kind: "attempt", tries: 4 },
  ],
  rows: [2, 3],
  ...over,
});

const render = (props: Partial<React.ComponentProps<typeof ImportSessionRow>> = {}): void =>
  act(() =>
    root.render(
      <ImportSessionRow
        session={session()}
        scales={DEFAULT_GRADE_SCALES}
        borderBottom="none"
        {...props}
      />
    )
  );
const lines = (): string[] =>
  [...host.querySelectorAll("label > span > span")].map((el) => el.textContent ?? "");
const text = (): string => host.textContent ?? "";

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  root = createRoot(host);
});
afterEach(() => act(() => root.unmount()));

describe("import session row", () => {
  it("shows the name, then the date and the Log row's tally with the top send", () => {
    render({ session: session({ name: "Tuesday night session" }) });
    expect(lines()).toEqual(["Tuesday night session", "Oct 14, 2024 · 1 sent · top V9"]);
    expect(text()).not.toContain("Outdoor");
    expect(text()).not.toContain("climb");
  });

  it("has no checkbox and no RPE when neither applies, as in the wizard", () => {
    render();
    expect(lines()[0]).toBe("Climbing session");
    expect(host.querySelector("input")).toBeNull();
    expect(text()).not.toContain("RPE");
  });

  it("leaves out the top send when nothing was sent", () => {
    render({ session: session({ climbs: [] }) });
    expect(lines()[1]).toBe("Oct 14, 2024 · 0 sent");
  });

  it("ends with the file's RPE when it gave one", () => {
    render({ session: session({ rpe: 7 }) });
    expect(text().endsWith("RPE 7")).toBe(true);
  });

  it("puts a checkbox first when rows are selectable, and toggles it", () => {
    let toggled = 0;
    render({ selection: { checked: false, disabled: false, onToggle: () => toggled++ } });
    const box = host.querySelector("label")?.firstElementChild;
    expect(box?.tagName).toBe("INPUT");
    act(() => (box as HTMLInputElement).click());
    expect(toggled).toBe(1);
  });
});
