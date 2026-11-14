import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { ClimbLogRow, type ClimbLogRowProps } from "./ClimbLogRow";

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

const row: ClimbLogRowProps["row"] = {
  id: "c1",
  name: "The Arete",
  gradeLabel: "V5",
  meta: "The Depot · Nov 12",
  pill: { kind: "project", label: "Project" },
  count: 3,
} as ClimbLogRowProps["row"];

function mount(props: Partial<ClimbLogRowProps> = {}): void {
  act(() =>
    root.render(
      <MemoryRouter>
        <ClimbLogRow row={row} {...props} />
      </MemoryRouter>
    )
  );
}

describe("ClimbLogRow", () => {
  it("links to the climb's page and reads grade, name with its count, meta and pill", () => {
    mount();
    const link = container.querySelector("a")!;
    expect(link.getAttribute("href")).toBe("/app/log/climbs/c1");
    expect(link.getAttribute("aria-label")).toBe("V5, The Arete ×3, The Depot · Nov 12, Project");
    expect(container.querySelector(".grade-badge")?.textContent).toBe("V5");
    expect(container.querySelector(".climb-pill")?.textContent).toBe("Project");
  });

  it("runs onPress instead of opening, and is plain text with no climb", () => {
    const onPress = vi.fn();
    mount({ onPress });
    act(() => container.querySelector("button")!.click());
    expect(onPress).toHaveBeenCalled();
    mount({ row: { ...row, id: null } });
    expect(container.querySelector("a, button")).toBeNull();
    expect(container.querySelector(".climb-row-name--plain")).not.toBeNull();
  });

  it("fills the badge with a circuit's colour in place of a grade", () => {
    mount({ row: { ...row, colour: "blue" } });
    expect(container.querySelector(".grade-badge")?.textContent).toBe("");
    expect(container.querySelector<HTMLElement>(".grade-badge")?.style.background).not.toBe("");
  });
});
