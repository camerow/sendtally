import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { HangFeature } from "@sendtally/features/hang";
import { WeightUnitSection } from "./WeightUnitSection";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const hang = vi.hoisted(() => ({
  feature: null as unknown as HangFeature,
  saveSettings: vi.fn(),
}));

vi.mock("../../lib/useAppApi", () => ({ useAppApi: () => ({}) }));
vi.mock("@sendtally/features/hang", () => ({
  useHang: () => hang.feature,
  useHangActions: () => ({ saveSettings: hang.saveSettings }),
}));

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
  hang.saveSettings.mockReset();
});

const radio = (label: string): HTMLButtonElement | undefined =>
  [...container.querySelectorAll<HTMLButtonElement>("[role=radio]")].find(
    (b) => b.textContent === label
  );

describe("WeightUnitSection", () => {
  it("keeps the section while the training loads", () => {
    hang.feature = { state: { status: "loading" }, reload: vi.fn() } as unknown as HangFeature;
    act(() => root.render(<WeightUnitSection />));
    expect(container.textContent).toContain("Weight units");
    expect(radio("kg")).toBeUndefined();
  });

  it("shows the saved unit and saves the one picked", () => {
    hang.feature = {
      state: { status: "ready", data: { settings: { units: "lb" } } },
      reload: vi.fn(),
    } as unknown as HangFeature;
    act(() => root.render(<WeightUnitSection />));
    expect(radio("lb")?.getAttribute("aria-checked")).toBe("true");
    act(() => radio("kg")?.click());
    expect(hang.saveSettings).toHaveBeenCalledWith({ units: "kg" });
  });
});
