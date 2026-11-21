import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { DarkWeek } from "./DarkWeek";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

let root: Root;
let host: HTMLDivElement;

const week = [null, [], null, null, null, null, null] as const;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe("DarkWeek", () => {
  it("is a picture with no onToggle", () => {
    act(() => root.render(<DarkWeek week={week} />));
    expect(host.querySelectorAll("button")).toHaveLength(0);
  });

  it("makes each day a button that toggles it, named in full and pressed when on", () => {
    const onToggle = vi.fn();
    act(() => root.render(<DarkWeek week={week} onToggle={onToggle} />));
    const buttons = [...host.querySelectorAll("button")];
    expect(buttons).toHaveLength(7);
    expect(buttons[1]?.getAttribute("aria-label")).toBe("Tuesday");
    expect(buttons[1]?.getAttribute("aria-pressed")).toBe("true");
    expect(buttons[0]?.getAttribute("aria-pressed")).toBe("false");
    expect(buttons.every((b) => b.type === "button")).toBe(true);
    act(() => buttons[3]?.click());
    expect(onToggle).toHaveBeenCalledWith(3);
  });
});
