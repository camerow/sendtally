import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ToastProvider, useToast, type ToastMessage } from "./Toast";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let show: (toast: ToastMessage) => void;

function Capture(): null {
  const toast = useToast();
  React.useEffect(() => {
    show = toast.show;
  }, [toast]);
  return null;
}

beforeEach(() => {
  vi.useFakeTimers();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <ToastProvider>
        <Capture />
      </ToastProvider>
    )
  );
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

const toast = (): Element | null => container.querySelector(".toast");

describe("Toast", () => {
  it("shows a message for four seconds", () => {
    act(() => show({ message: "Saved" }));
    expect(toast()?.textContent).toBe("Saved");
    act(() => vi.advanceTimersByTime(3999));
    expect(toast()).not.toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(toast()).toBeNull();
  });

  it("runs its action and hides", () => {
    const onPress = vi.fn();
    act(() => show({ message: "Set removed", action: { label: "Undo", onPress } }));
    act(() => container.querySelector<HTMLButtonElement>(".toast-action")?.click());
    expect(onPress).toHaveBeenCalledOnce();
    expect(toast()).toBeNull();
  });

  it("sits 12 above a detail screen's footer, and at its own place without one", () => {
    act(() => show({ message: "Plain" }));
    expect(container.querySelector<HTMLElement>(".toast-region")?.style.bottom).toBe("");
    const footer = document.createElement("div");
    footer.className = "detail-footer";
    footer.getBoundingClientRect = () => ({ top: window.innerHeight - 83 }) as DOMRect;
    document.body.appendChild(footer);
    act(() => show({ message: "Set removed" }));
    expect(container.querySelector<HTMLElement>(".toast-region")?.style.bottom).toBe("95px");
    footer.remove();
  });

  it("restarts the clock for a newer toast", () => {
    act(() => show({ message: "First" }));
    act(() => vi.advanceTimersByTime(3000));
    act(() => show({ message: "Second" }));
    act(() => vi.advanceTimersByTime(3000));
    expect(toast()?.textContent).toBe("Second");
  });
});
