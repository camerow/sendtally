import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Sheet } from "./Sheet";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

/** jsdom has no dialog implementation, so the modal calls become the `open` attribute. */
HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute("open", "");
};

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

function mount(open: boolean, onClose = vi.fn(), onSave = vi.fn()): HTMLDialogElement | null {
  act(() =>
    root.render(
      <Sheet
        open={open}
        title="Save as template"
        onClose={onClose}
        action={{ label: "Save", onPress: onSave }}
      >
        <input aria-label="Name" />
      </Sheet>
    )
  );
  return container.querySelector("dialog");
}

describe("Sheet", () => {
  it("renders nothing while closed", () => {
    expect(mount(false)).toBeNull();
  });

  it("opens as a modal named by its title", () => {
    const dialog = mount(true)!;
    expect(dialog.open).toBe(true);
    const title = document.getElementById(dialog.getAttribute("aria-labelledby")!);
    expect(title?.textContent).toBe("Save as template");
  });

  it("closes on Escape, the scrim and Cancel, and saves from its action", () => {
    const onClose = vi.fn();
    const onSave = vi.fn();
    const dialog = mount(true, onClose, onSave)!;
    act(() => {
      dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
    });
    act(() => {
      dialog.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
      dialog.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    act(() => container.querySelector<HTMLButtonElement>(".sheet-cancel")?.click());
    expect(onClose).toHaveBeenCalledTimes(3);
    act(() => container.querySelector<HTMLButtonElement>(".sheet-action")?.click());
    expect(onSave).toHaveBeenCalledOnce();
  });

  it("focuses the child marked data-autofocus once open", () => {
    act(() =>
      root.render(
        <Sheet open title="Note" onClose={() => {}}>
          <input aria-label="Date" />
          <textarea aria-label="Note" data-autofocus />
        </Sheet>
      )
    );
    expect(document.activeElement).toBe(container.querySelector("textarea"));
  });

  it("draws a kicker above the title, amber when asked", () => {
    act(() =>
      root.render(
        <Sheet
          open
          title="Morning session is still going"
          kicker="Already running"
          kickerTone="amber"
          onClose={() => {}}
        />
      )
    );
    const head = container.querySelector(".sheet-head")!;
    expect(Array.from(head.children).map((c) => c.textContent)).toEqual([
      "Already running",
      "Morning session is still going",
    ]);
    expect(head.firstElementChild?.className).toBe("sheet-kicker sheet-kicker--amber");
  });

  it("stays open for a click that started inside it", () => {
    const onClose = vi.fn();
    const dialog = mount(true, onClose)!;
    const input = dialog.querySelector("input")!;
    act(() => {
      input.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
      dialog.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});
