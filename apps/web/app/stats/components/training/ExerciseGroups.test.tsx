import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import type { ExerciseGroupVM } from "@sendtally/features/statistics";
import { aHang, hangData, WithHang } from "../../../training/data/testHang";
import { ExerciseGroups } from "./ExerciseGroups";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("../../../lib/useAppApi", () => ({ useAppApi: () => ({}) }));
vi.mock("@sendtally/features/activities", async (actual) => ({
  ...(await actual<object>()),
  useWeightUnit: () => "kg",
}));
vi.mock("@sendtally/features/statistics", async (actual) => ({
  ...(await actual<object>()),
  useExercises: () => ({
    state: { status: "ready", data: [{ id: "e1", name: "Pull-up", kind: "strength" }] },
  }),
}));

const groups: ExerciseGroupVM[] = [
  {
    kind: "hangboard",
    rows: [
      {
        key: "half",
        name: "Half crimp",
        count: 1,
        values: [4],
        change: 0,
        metric: "load",
        meta: "20 mm · 10s · 1 time",
      },
    ],
  },
  {
    kind: "strength",
    rows: [
      { key: "pull-up", name: "Pull-up", count: 2, values: [5, 10], change: 5, metric: "load" },
      { key: "dips", name: "Dips", count: 1, values: [0], change: 0, metric: "load" },
    ],
  },
];

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

function render(data = hangData()): void {
  act(() =>
    root.render(
      <MemoryRouter>
        <WithHang data={data}>
          <ExerciseGroups groups={groups} />
        </WithHang>
      </MemoryRouter>
    )
  );
}

const byLabel = (start: string): Element | undefined =>
  [...container.querySelectorAll("[aria-label]")].find((e) =>
    e.getAttribute("aria-label")?.startsWith(start)
  );

describe("exercise trends", () => {
  it("opens an exercise's page, a grip its own page", () => {
    render();
    const pullUp = byLabel("Pull-up, 2 times, +5 kg");
    expect(pullUp?.getAttribute("href")).toBe("/app/train/exercise/e1");
    expect(byLabel("Half crimp")?.getAttribute("href")).toBe("/app/train/grip/half");
  });

  it("compares grips once two are complete on one setup", () => {
    render(hangData({ sessions: [aHang({ gripId: "half" }), aHang({ gripId: "open" })] }));
    expect(byLabel("Compare exercises")?.getAttribute("href")).toBe("/app/train/grips/compare");
  });

  it("offers no compare with only one grip complete on a setup", () => {
    render(hangData({ sessions: [aHang({ gripId: "half" }), aHang({ gripId: "open", pct: 50 })] }));
    expect(byLabel("Compare exercises")).toBeUndefined();
  });

  it("draws a sparkline from two points, none from one", () => {
    render();
    expect(container.querySelectorAll("svg polyline")).toHaveLength(1);
  });

  it("leaves a row with nowhere to go as a plain row", () => {
    render();
    expect(byLabel("Dips")?.tagName).toBe("DIV");
  });
});
