import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { HangFeature } from "@sendtally/features/hang";
import { HangDataProvider } from "./HangDataProvider";
import { useHangData } from "./HangDataContext";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const hang = vi.hoisted(() => ({ feature: null as unknown as HangFeature }));

vi.mock("../../lib/useAppApi", () => ({ useAppApi: () => ({}) }));
vi.mock("@sendtally/features/hang", () => ({
  useHang: () => hang.feature,
  useHangActions: () => ({}),
}));

let container: HTMLDivElement;
let root: Root;

function Today(): React.ReactElement {
  const { today } = useHangData();
  return <span data-today>{today}</span>;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 12, 23, 59, 30));
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

const render = (): void =>
  act(() =>
    root.render(
      <HangDataProvider>
        <Today />
      </HangDataProvider>
    )
  );

describe("HangDataProvider", () => {
  it("shows a retry until the training loads", () => {
    const reload = vi.fn();
    hang.feature = {
      state: { status: "error", message: "Offline" },
      reload,
    } as unknown as HangFeature;
    render();
    expect(container.querySelector("[data-today]")).toBeNull();
    expect(container.textContent).toContain("Offline");
    act(() => container.querySelector("button")?.click());
    expect(reload).toHaveBeenCalledOnce();
  });

  it("hands today to everything below, refreshed when the tab is shown again", () => {
    hang.feature = {
      state: { status: "ready", data: {} },
      reload: vi.fn(),
    } as unknown as HangFeature;
    render();
    const today = (): string | null | undefined =>
      container.querySelector("[data-today]")?.textContent;
    expect(today()).toBe("2026-11-12");
    vi.setSystemTime(new Date(2026, 10, 13, 8, 0));
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(today()).toBe("2026-11-13");
  });
});
