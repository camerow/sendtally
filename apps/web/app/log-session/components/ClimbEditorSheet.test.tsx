import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { newClimb } from "@sendtally/features/log-session";
import { ClimbEditorSheet } from "./ClimbEditorSheet";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

/** jsdom has no dialog implementation, so the modal calls become the `open` attribute. */
HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute("open", "");
};
HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
  this.removeAttribute("open");
};

let container: HTMLDivElement;
let root: Root;

function mount(onClose: () => void): HTMLDialogElement {
  act(() =>
    root.render(
      <ClimbEditorSheet
        climb={newClimb("climb-1", "v")}
        index={0}
        count={2}
        scale="v"
        project={false}
        suggestions={[]}
        onChange={() => {}}
        onChangeDiscipline={() => {}}
        onChangeName={() => {}}
        onPick={() => {}}
        onToggleProject={() => {}}
        onRemove={() => {}}
        onClose={onClose}
      />
    )
  );
  return container.querySelector("dialog")!;
}

function pointer(target: Element, type: "pointerdown" | "click"): void {
  act(() => {
    target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true }));
  });
}

describe("ClimbEditorSheet", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("opens as a modal dialog", () => {
    const dialog = mount(() => {});
    expect(dialog.open).toBe(true);
    expect(dialog.getAttribute("aria-label")).toBe("Climb 1 of 2");
  });

  it("closes on a tap that starts and ends on the backdrop", () => {
    const onClose = vi.fn();
    const dialog = mount(onClose);
    pointer(dialog, "pointerdown");
    pointer(dialog, "click");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("stays open when a drag starts inside the panel and ends on the backdrop", () => {
    const onClose = vi.fn();
    const dialog = mount(onClose);
    pointer(dialog.querySelector(".climb-sheet-rail")!, "pointerdown");
    pointer(dialog, "click");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("ignores clicks inside the panel", () => {
    const onClose = vi.fn();
    const dialog = mount(onClose);
    const panel = dialog.querySelector(".climb-sheet-panel")!;
    pointer(panel, "pointerdown");
    pointer(panel, "click");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    const dialog = mount(onClose);
    act(() => {
      dialog.dispatchEvent(new Event("cancel", { bubbles: true, cancelable: true }));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes from the Done button", () => {
    const onClose = vi.fn();
    const dialog = mount(onClose);
    pointer(dialog.querySelector(".climb-sheet-done")!, "click");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

function drag(grip: Element, from: number, to: number, ms = 300): void {
  const now = vi.spyOn(performance, "now");
  now.mockReturnValue(0);
  act(() => {
    grip.dispatchEvent(
      new MouseEvent("pointerdown", { bubbles: true, clientY: from, button: 0 }) as PointerEvent
    );
  });
  act(() => {
    grip.dispatchEvent(new MouseEvent("pointermove", { bubbles: true, clientY: to }));
  });
  now.mockReturnValue(ms);
  act(() => {
    grip.dispatchEvent(new MouseEvent("pointerup", { bubbles: true, clientY: to }));
  });
  now.mockRestore();
}

describe("ClimbEditorSheet drag to dismiss", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("closes after a long drag down on the grip", () => {
    const onClose = vi.fn();
    const dialog = mount(onClose);
    drag(dialog.querySelector(".climb-sheet-grip")!, 100, 260);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes after a short flick", () => {
    const onClose = vi.fn();
    const dialog = mount(onClose);
    drag(dialog.querySelector(".climb-sheet-grip")!, 100, 150, 40);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("springs back after a short, slow drag", () => {
    const onClose = vi.fn();
    const dialog = mount(onClose);
    const panel = dialog.querySelector<HTMLElement>(".climb-sheet-panel")!;
    drag(dialog.querySelector(".climb-sheet-grip")!, 100, 130, 600);
    expect(onClose).not.toHaveBeenCalled();
    expect(panel.style.transform).toBe("");
  });

  it("follows the pointer while dragging", () => {
    const dialog = mount(() => {});
    const grip = dialog.querySelector(".climb-sheet-grip")!;
    const panel = dialog.querySelector<HTMLElement>(".climb-sheet-panel")!;
    act(() => {
      grip.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, clientY: 100, button: 0 }));
      grip.dispatchEvent(new MouseEvent("pointermove", { bubbles: true, clientY: 140 }));
    });
    expect(panel.style.transform).toBe("translateY(40px)");
  });
});
