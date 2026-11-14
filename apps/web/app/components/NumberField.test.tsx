import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { NumberField, type NumberFieldMode } from "./NumberField";

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

function mount(
  mode: NumberFieldMode,
  value: number | null,
  onChange = vi.fn(),
  placeholder?: string
): HTMLInputElement {
  act(() =>
    root.render(
      <>
        <NumberField
          label="Hang"
          mode={mode}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
        />
        <NumberField label="Rest" mode={mode} value={value} onChange={() => {}} />
      </>
    )
  );
  return container.querySelector("input")!;
}

/** React tracks an input's value itself, so a typed value goes through the native setter. */
function type(input: HTMLInputElement, text: string): void {
  act(() => {
    input.focus();
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, text);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

const key = (input: HTMLInputElement, k: string): void =>
  act(() => {
    input.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
  });

describe("NumberField", () => {
  it("is a labelled input on the phone's number pad", () => {
    const input = mount({ kind: "number", step: 1 }, 12);
    expect(input.inputMode).toBe("decimal");
    expect(container.querySelector("label")?.textContent).toBe("Hang");
    expect(input.labels?.[0]?.textContent).toBe("Hang");
    expect(input.value).toBe("12");
  });

  it("shows time as m:ss and commits a typed time on blur", () => {
    const onChange = vi.fn();
    const input = mount({ kind: "time" }, 10, onChange);
    expect(input.value).toBe("0:10");
    type(input, "130");
    act(() => input.blur());
    expect(onChange).toHaveBeenCalledWith(90);
  });

  it("leaves the value alone when nothing was changed or nothing typed", () => {
    const onChange = vi.fn();
    const input = mount({ kind: "number", step: 1 }, 5, onChange);
    act(() => input.focus());
    act(() => input.blur());
    type(input, "");
    act(() => input.blur());
    expect(onChange).not.toHaveBeenCalled();
    expect(input.value).toBe("5");
  });

  it("steps with the arrow keys within its limits", () => {
    const onChange = vi.fn();
    const input = mount({ kind: "number", step: 2.5, max: 20, decimals: true }, 20, onChange);
    key(input, "ArrowDown");
    expect(onChange).toHaveBeenLastCalledWith(17.5);
    key(input, "ArrowUp");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("steps time by thirty seconds", () => {
    const onChange = vi.fn();
    const input = mount({ kind: "time" }, 180, onChange);
    key(input, "ArrowUp");
    expect(onChange).toHaveBeenCalledWith(210);
  });

  it("shows the placeholder while there is no value, and takes a typed one", () => {
    const onChange = vi.fn();
    const input = mount({ kind: "number", step: 2.5, decimals: true }, null, onChange, "BW");
    expect(input.value).toBe("");
    expect(input.placeholder).toBe("BW");
    act(() => input.focus());
    act(() => input.blur());
    expect(onChange).not.toHaveBeenCalled();
    type(input, "10");
    act(() => input.blur());
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it("steps an empty field from zero, with a dash by default", () => {
    const onChange = vi.fn();
    const input = mount({ kind: "number", step: 2.5, decimals: true }, null, onChange);
    expect(input.placeholder).toBe("–");
    key(input, "ArrowUp");
    expect(onChange).toHaveBeenCalledWith(2.5);
  });

  it("moves to the next field on Enter, committing what was typed", () => {
    const onChange = vi.fn();
    const input = mount({ kind: "number", step: 1 }, 5, onChange);
    type(input, "8");
    key(input, "Enter");
    expect(onChange).toHaveBeenCalledWith(8);
    expect(document.activeElement).toBe(container.querySelectorAll("input")[1]);
  });
});
