import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { SetRow } from "./SetRow";

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

const mount = (selected: boolean) => {
  const onSelect = vi.fn();
  const onToggle = vi.fn();
  const onRemove = vi.fn();
  act(() =>
    root.render(
      <SetRow
        position="2"
        label="Squat set 2"
        selected={selected}
        onSelect={onSelect}
        onToggle={onToggle}
        onRemove={onRemove}
        removeLabel="Remove set 2"
      >
        <input aria-label="Reps" />
      </SetRow>
    )
  );
  return { onSelect, onToggle, onRemove };
};

const click = (el: Element | null): void => {
  act(() => el?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
};

describe("SetRow", () => {
  it("selects from the row, but not from its input or its tick", () => {
    const { onSelect, onToggle } = mount(false);
    click(container.querySelector(".set-lead"));
    expect(onSelect).toHaveBeenCalledTimes(1);
    click(container.querySelector('input[aria-label="Reps"]'));
    click(container.querySelector('input[type="checkbox"]'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("keeps the position a button to select it by keyboard", () => {
    const { onSelect } = mount(false);
    click(container.querySelector("button.set-pos"));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("puts Remove in the position's place while selected", () => {
    const { onRemove, onSelect } = mount(true);
    expect(container.querySelector(".set-pos")?.textContent).toBe("");
    click(container.querySelector('button[aria-label="Remove set 2"]'));
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
