import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { Gym } from "@sendtally/features/gyms";
import {
  DEFAULT_GRADE_PREFS,
  newClimb,
  withClimbKind,
  type ClimbDraft,
} from "@sendtally/features/log-session";
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

function mount(
  onClose: () => void,
  onChange: (climb: ClimbDraft) => void = () => {},
  name = "",
  gyms: Gym[] = [],
  climb: ClimbDraft = newClimb("climb-1", "v")
): HTMLDialogElement {
  act(() =>
    root.render(
      <ClimbEditorSheet
        climb={{ ...climb, name }}
        index={0}
        count={2}
        gyms={gyms}
        prefs={DEFAULT_GRADE_PREFS}
        project={false}
        suggestions={[]}
        onChange={onChange}
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
    expect(dialog.getAttribute("aria-label")).toBe("Add climb");
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
    pointer(dialog.querySelector(".climb-switch")!, "pointerdown");
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

  it("picks a grade from the dropdown", () => {
    const onChange = vi.fn();
    const dialog = mount(() => {}, onChange);
    const select = dialog.getElementsByTagName("select")[1]!;
    expect(select.options.length).toBeGreaterThan(1);
    act(() => {
      select.value = "V5";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ grade: "V5" }));
  });

  it("marks an attempt as sent from the Sent switch", () => {
    const onChange = vi.fn();
    const dialog = mount(() => {}, onChange);
    const toggle = dialog.querySelector<HTMLInputElement>(".climb-switch")!;
    expect(toggle.checked).toBe(false);
    act(() => toggle.click());
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "send", style: "flash", tries: 1 })
    );
  });

  describe("with a gym that has circuits", () => {
    const gym: Gym = {
      id: "g",
      name: "Barn",
      scale: "v",
      walls: [],
      circuits: [
        { id: "p", colour: "purple", label: "", low: 3, high: 5 },
        { id: "r", colour: "red", label: "", low: 5, high: 6 },
      ],
    };

    it("grades a climb off the circuits and offers the gym's circuits as a type", () => {
      const onChange = vi.fn();
      const dialog = mount(() => {}, onChange, "", [gym]);
      const [kind, grade] = dialog.getElementsByTagName("select");
      expect([...kind!.options].map((o) => o.text)).toEqual([
        "Boulder",
        "Route",
        "Endurance",
        "Barn circuits",
      ]);
      expect(kind!.value).toBe("boulder");
      expect(grade!.value).toBe("V3");
      act(() => {
        kind!.value = "g";
        kind!.dispatchEvent(new Event("change", { bubbles: true }));
      });
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ grade: "V4", circuit: expect.objectContaining({ id: "p" }) })
      );
      expect(localStorage.getItem("sendtally:climb-kind")).toBe("g");
    });

    it("lists the gym's circuits as grades and switches back to a boulder grade", () => {
      const onChange = vi.fn();
      const onPurple = withClimbKind(newClimb("climb-1", "v"), "g", DEFAULT_GRADE_PREFS, [gym]);
      const dialog = mount(() => {}, onChange, "", [gym], onPurple);
      const [kind, grade] = dialog.getElementsByTagName("select");
      expect(kind!.value).toBe("g");
      expect([...grade!.options].map((o) => o.text)).toEqual(["Purple · V3–V5", "Red · V5–V6"]);
      act(() => {
        grade!.value = "r";
        grade!.dispatchEvent(new Event("change", { bubbles: true }));
      });
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ grade: "V5", circuit: expect.objectContaining({ id: "r" }) })
      );
      act(() => {
        kind!.value = "boulder";
        kind!.dispatchEvent(new Event("change", { bubbles: true }));
      });
      expect(onChange.mock.lastCall![0]).not.toHaveProperty("circuit");
      expect(localStorage.getItem("sendtally:climb-kind")).toBe("boulder");
    });
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    const dialog = mount(onClose);
    act(() => {
      dialog.dispatchEvent(new Event("cancel", { bubbles: true, cancelable: true }));
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // A note needs a climb name to roll up under, so there is nothing to type into
  // until the climb has one - the label says why instead of a dead field.
  it("locks the note and project until the climb is named", () => {
    const dialog = mount(() => {});
    expect(dialog.querySelector("textarea")?.disabled).toBe(true);
    expect(dialog.querySelector<HTMLButtonElement>("button[aria-pressed]")?.disabled).toBe(true);
    expect(dialog.textContent).toContain(
      "A climb must have a name to have a note or be marked as a project"
    );
  });

  it("offers the note field once the climb is named", () => {
    const dialog = mount(
      () => {},
      () => {},
      "Cave problem"
    );
    expect(dialog.querySelector("textarea")?.disabled).toBe(false);
    expect(dialog.textContent).not.toContain("must have a name");
  });

  it("closes from the Save button", () => {
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
