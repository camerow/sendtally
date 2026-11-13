import { afterEach, beforeEach, describe, expect, it } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import type { GradeClimbsVM } from "@sendtally/features/climbs";
import { ClimbsByGrade, gradeClimbHref } from "./ClimbsByGrade";

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

const climb = (key: string, name: string, kind: "climb" | "session" | "activity") => ({
  key,
  target: { kind, id: key },
  row: {
    id: key,
    gradeLabel: "V5",
    name,
    meta: "",
    pill: { kind: "sent" as const, label: "Sent" },
  },
});

const grades: GradeClimbsVM[] = [
  { key: "v5", gradeLabel: "V5", split: "2 sent of 3", climbs: [climb("c1", "Arete", "climb")] },
  { key: "v4", gradeLabel: "V4", split: "1 sent of 1", climbs: [climb("s1", "Slab", "session")] },
];

const rows = (): HTMLButtonElement[] =>
  Array.from(container.querySelectorAll<HTMLButtonElement>(".expandable-row"));

describe("ClimbsByGrade", () => {
  it("opens one grade at a time", () => {
    act(() =>
      root.render(
        <MemoryRouter>
          <ClimbsByGrade grades={grades} />
        </MemoryRouter>
      )
    );
    expect(container.textContent).not.toContain("Arete");
    act(() => rows()[0]?.click());
    expect(rows()[0]?.getAttribute("aria-expanded")).toBe("true");
    expect(container.textContent).toContain("Arete");
    act(() => rows()[1]?.click());
    expect(container.textContent).not.toContain("Arete");
    expect(container.textContent).toContain("Slab");
  });

  it("opens a climb's page or a session's, and leaves an activity plain", () => {
    expect(gradeClimbHref({ kind: "climb", id: "c 1" })).toBe("/app/log/climbs/c%201");
    expect(gradeClimbHref({ kind: "session", id: "manual-1" })).toBe("/app/sessions/manual-1");
    expect(gradeClimbHref({ kind: "activity", id: "a1" })).toBeNull();
    expect(gradeClimbHref(null)).toBeNull();
  });
});
