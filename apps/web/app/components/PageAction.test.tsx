import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { PageAction } from "./PageAction";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const setNarrow = (matches: boolean): void => {
  window.matchMedia = vi.fn(() => ({
    matches,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
};

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const button = (): HTMLButtonElement => container.querySelector(".page-action")!;

describe("PageAction", () => {
  it("runs its action straight away when it has no menu", () => {
    setNarrow(false);
    const onPress = vi.fn();
    act(() => root.render(<PageAction label="Schedule" onPress={onPress} />));
    act(() => button().click());
    expect(onPress).toHaveBeenCalledOnce();
    expect(button().getAttribute("aria-haspopup")).toBeNull();
  });

  it("opens its menu as a dropdown on desktop and as a sheet at 375", () => {
    const onSelect = vi.fn();
    const items = [{ label: "New workout", onSelect }];
    setNarrow(false);
    act(() => root.render(<PageAction label="Create" items={items} />));
    act(() => button().click());
    expect(container.querySelector(".more-menu")).not.toBeNull();
    act(() => container.querySelector<HTMLButtonElement>(".more-item")!.click());
    expect(onSelect).toHaveBeenCalledOnce();
    expect(container.querySelector(".more-menu")).toBeNull();

    setNarrow(true);
    act(() => root.render(<PageAction label="Create" items={[...items]} />));
    act(() => button().click());
    expect(document.querySelector(".more-sheet")).not.toBeNull();
  });
});
