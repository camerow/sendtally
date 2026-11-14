import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import { aHang, hangData, WithHang } from "../data/testHang";
import { GripPage } from "./GripPage";
import { CompareGripsPage } from "./CompareGripsPage";

import type * as T_useLibrary from "../library/useLibrary";

import type * as T_workouts from "@sendtally/features/workouts";
import { ToastProvider } from "../../components/Toast";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute("open", "");
};

vi.mock("../../lib/useAppApi", () => ({ useAppApi: () => ({}) }));
vi.mock("@sendtally/features/workouts", async (actual) => ({
  ...(await actual<typeof T_workouts>()),
  useWorkoutActions: () => ({ saveWorkout: vi.fn(), deleteWorkout: vi.fn() }),
}));
vi.mock("../library/useLibrary", async (actual) => ({
  ...(await actual<typeof T_useLibrary>()),
  useLibrary: () => ({ state: { status: "loading" }, reload: vi.fn() }),
}));

const sessions = [
  aHang({ date: "2026-09-01", loadKg: 2 }),
  aHang({ date: "2026-09-08", loadKg: 6, workoutId: "other" }),
  aHang({ date: "2026-09-15", loadKg: 9, pct: 75 }),
  aHang({ date: "2026-09-22", loadKg: 6 }),
  aHang({ date: "2026-09-10", loadKg: -4, edgeMm: 15 }),
  aHang({ date: "2026-09-12", loadKg: 20, gripId: "open" }),
];

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  window.matchMedia = vi.fn(() => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const archiveGrip = vi.fn(async () => undefined);

function mount(page: React.ReactNode): void {
  act(() =>
    root.render(
      <ToastProvider>
        <MemoryRouter initialEntries={["/app/train", "/page"]} initialIndex={1}>
          <WithHang data={hangData({ sessions })} actions={{ archiveGrip }}>
            <Routes>
              <Route path="/page" element={page} />
              <Route path="*" element={<p data-left>left</p>} />
            </Routes>
          </WithHang>
        </MemoryRouter>
      </ToastProvider>
    )
  );
}

const text = (): string => container.textContent ?? "";
const click = (el: Element | null | undefined): void => act(() => (el as HTMLElement).click());
const button = (label: string): HTMLElement | undefined =>
  [...document.querySelectorAll<HTMLElement>("button")].find((b) => b.textContent === label);

describe("GripPage", () => {
  it("shows the grip across workouts on its most used setup", () => {
    mount(<GripPage id="half" />);
    expect(container.querySelector("h1")?.textContent).toBe("Half crimp");
    expect(text()).toContain("Fingers");
    expect(text()).toContain("Added load · completed");
    expect(text()).toContain("▲ 4 kg");
    expect(text()).toContain("Reached +5 kg");
    expect(text()).toContain("History · 4 sessions");
    expect(text()).toMatch(/is up 4 kg/);
    expect(container.querySelectorAll(".setup-chips button")).toHaveLength(3);
  });

  it("switches setup with its chips", () => {
    mount(<GripPage id="half" />);
    click([...container.querySelectorAll(".setup-chips button")].at(-1));
    expect(text()).toContain("History · 5 sessions");
  });

  it("compares grips or archives this one from ···", () => {
    mount(<GripPage id="half" />);
    click(container.querySelector('[aria-label="More"]'));
    expect([...document.querySelectorAll(".more-item")].map((b) => b.textContent)).toEqual([
      "Compare exercises",
      "Archive",
    ]);
    click(button("Archive"));
    click(document.querySelector(".sheet-action--danger"));
    expect(archiveGrip).toHaveBeenCalledWith(expect.objectContaining({ id: "half" }));
    expect(container.querySelector("[data-left]")).not.toBeNull();
  });
});

describe("CompareGripsPage", () => {
  it("bars every grip's best load on the most used setup", () => {
    mount(<CompareGripsPage />);
    const names = [...container.querySelectorAll(".compare-row-name")].map((n) => n.textContent);
    expect(names).toEqual(["Open hand", "Half crimp"]);
    expect(container.querySelector(".compare-row")?.getAttribute("href")).toBe(
      "/app/train/grip/open"
    );
  });
});
