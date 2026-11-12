import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { HangFeature } from "@sendtally/features/hang";
import type { StravaPostingFeature } from "@sendtally/features/settings";
import { StravaPostingSection } from "./StravaPostingSection";

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
  hang.feature = {
    state: { status: "ready", data: { settings: { postToStrava: true } } },
    reload: vi.fn(),
  } as unknown as HangFeature;
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  hang.saveSettings.mockReset();
});

function posting(change: Partial<StravaPostingFeature> = {}): StravaPostingFeature {
  return {
    enabled: true,
    since: "2026-11-01",
    training: false,
    busy: false,
    error: null,
    setEnabled: vi.fn(),
    setSince: vi.fn(),
    setTraining: vi.fn(),
    ...change,
  };
}

const toggle = (label: string): HTMLButtonElement | null =>
  container.querySelector<HTMLButtonElement>(`[role=switch][aria-label="${label}"]`);

describe("StravaPostingSection", () => {
  it("has mobile's four rows, each switch saving its own setting", () => {
    const feature = posting();
    act(() => root.render(<StravaPostingSection posting={feature} />));
    expect(toggle("Post climbing sessions")?.getAttribute("aria-checked")).toBe("true");
    expect(container.querySelector<HTMLInputElement>("input[type=date]")?.value).toBe("2026-11-01");
    expect(toggle("Post hangboard sessions")?.getAttribute("aria-checked")).toBe("true");

    act(() => toggle("Post climbing sessions")?.click());
    expect(feature.setEnabled).toHaveBeenCalledWith(false);
    act(() => toggle("Post hangboard sessions")?.click());
    expect(hang.saveSettings).toHaveBeenCalledWith({ postToStrava: false });
    act(() => toggle("Post other training")?.click());
    expect(feature.setTraining).toHaveBeenCalledWith(true);
  });

  it("clears the post since date back to any date", () => {
    const feature = posting();
    act(() => root.render(<StravaPostingSection posting={feature} />));
    act(() => container.querySelector<HTMLButtonElement>("[aria-label=Clear]")?.click());
    expect(feature.setSince).toHaveBeenCalledWith("");
  });

  it("hides the date while climbing posting is off", () => {
    act(() => root.render(<StravaPostingSection posting={posting({ enabled: false })} />));
    expect(container.querySelector("input[type=date]")).toBeNull();
    expect(container.textContent).toContain("Off. Each session page keeps its own");
  });

  it("holds the hangboard switch until the training loads", () => {
    hang.feature = { state: { status: "loading" }, reload: vi.fn() } as unknown as HangFeature;
    act(() => root.render(<StravaPostingSection posting={posting()} />));
    expect(toggle("Post hangboard sessions")?.disabled).toBe(true);
  });
});
