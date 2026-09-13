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
