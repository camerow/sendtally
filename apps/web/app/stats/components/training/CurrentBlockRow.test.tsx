import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import type { Plan } from "@sendtally/api-client";
import { CurrentBlockRow } from "./CurrentBlockRow";

import type * as T_training from "@sendtally/features/training";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const plan = vi.hoisted(() => ({ value: null as unknown as Plan }));

vi.mock("../../../lib/useAppApi", () => ({ useAppApi: () => ({}) }));
vi.mock("../../../training/data/HangDataContext", () => ({
  useHangData: () => ({ today: "2026-11-12" }),
}));
vi.mock("@sendtally/features/training", async (actual) => ({
  ...(await actual<typeof T_training>()),
  useTrainingLog: () => ({
    log: { climbs: [], hangs: [], activities: [], plan: plan.value, workout: () => undefined },
    ready: true,
  }),
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
});

const mount = (blocks: Plan["blocks"]): void => {
  plan.value = { blocks, memberships: [], weekChanges: [], planChanges: [], membershipDays: [] };
  act(() =>
    root.render(
      <MemoryRouter>
        <CurrentBlockRow />
      </MemoryRouter>
    )
  );
};

describe("CurrentBlockRow", () => {
  it("names the running block and its week, opening the block", () => {
    mount([{ id: "b1", name: "Winter base", start: "2026-11-09", weeks: 4, focus: null }]);
    const row = container.querySelector(".current-block");
    expect(row?.getAttribute("href")).toBe("/app/plan/block/b1");
    expect(row?.textContent).toContain("Winter base");
  });

  it("shows nothing outside a block", () => {
    mount([]);
    expect(container.innerHTML).toBe("");
  });
});
