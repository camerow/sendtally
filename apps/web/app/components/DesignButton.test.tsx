import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Button } from "@sendtally/design";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

let root: Root;
let host: HTMLDivElement;

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

/** What a browser does for Enter and Space on a focused control: the key, then a click if it took focus. */
const press = (el: HTMLElement, key: "Enter" | " "): void => {
  el.focus();
  el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
  el.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true }));
  if (document.activeElement === el) el.click();
};

describe("design Button, disabled", () => {
  it("cannot be pressed from the keyboard", () => {
    const onClick = vi.fn();
    act(() =>
      root.render(
        <Button variant="azure" disabled onClick={onClick}>
          Import 3 sessions
        </Button>
      )
    );
    const button = host.querySelector("button")!;
    press(button, "Enter");
    press(button, " ");
    expect(onClick).not.toHaveBeenCalled();
    expect(button.disabled).toBe(true);
  });

  it("as a link, cannot be followed from the keyboard", () => {
    const onClick = vi.fn();
    act(() =>
      root.render(
        <Button variant="azure" href="/app" disabled onClick={onClick}>
          Open the log
        </Button>
      )
    );
    const link = host.querySelector("a")!;
    press(link, "Enter");
    expect(onClick).not.toHaveBeenCalled();
    expect(link.getAttribute("aria-disabled")).toBe("true");
  });

  it("still presses when enabled", () => {
    const onClick = vi.fn();
    act(() => root.render(<Button onClick={onClick}>Save</Button>));
    press(host.querySelector("button")!, "Enter");
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
