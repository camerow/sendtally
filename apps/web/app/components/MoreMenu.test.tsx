import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MoreMenu } from "./MoreMenu";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function setNarrow(matches: boolean): void {
  window.matchMedia = vi.fn(() => ({
    matches,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function mount(onEdit = vi.fn(), onDelete = vi.fn()): HTMLButtonElement {
  act(() =>
    root.render(
      <MoreMenu
        label="More actions"
        items={[
          { label: "Edit workout", onSelect: onEdit },
          { label: "Delete", onSelect: onDelete, destructive: true },
        ]}
      />
    )
  );
  return container.querySelector<HTMLButtonElement>(".more-button")!;
}

const items = (): HTMLButtonElement[] =>
  Array.from(document.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'));

describe("MoreMenu", () => {
  it("drops a menu under its button on desktop and runs the row picked", () => {
    setNarrow(false);
    const onEdit = vi.fn();
    const button = mount(onEdit);
    act(() => button.click());
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(container.querySelector(".more-menu")).not.toBeNull();
    expect(items().map((i) => i.textContent)).toEqual(["Edit workout", "Delete"]);
    expect(items()[1]?.className).toContain("more-item--danger");
    act(() => items()[0]?.click());
    expect(onEdit).toHaveBeenCalledOnce();
    expect(items()).toHaveLength(0);
  });

  it("closes on Escape", () => {
    setNarrow(false);
    const button = mount();
    act(() => button.click());
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(items()).toHaveLength(0);
  });

  it("is a bottom sheet at 375 that the scrim closes", () => {
    setNarrow(true);
    const button = mount();
    act(() => button.click());
    const scrim = document.querySelector<HTMLDivElement>(".more-sheet-scrim");
    expect(scrim?.parentElement).toBe(document.body);
    expect(items()).toHaveLength(2);
    act(() => scrim?.click());
    expect(items()).toHaveLength(0);
  });
});
