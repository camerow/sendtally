import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { Plan } from "@sendtally/api-client";
import { CalendarMonth } from "./CalendarMonth";

import type * as T_training from "@sendtally/features/training";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const plan: Plan = {
  blocks: [{ id: "b1", name: "Winter base", start: "2026-11-02", weeks: 4, focus: null }],
  memberships: [],
  weekChanges: [],
  planChanges: [],
  membershipDays: [],
};

vi.mock("../../lib/useAppApi", () => ({ useAppApi: () => ({}) }));
vi.mock("../data/HangDataContext", () => ({ useHangData: () => ({ today: "2026-11-12" }) }));
vi.mock("@sendtally/features/training", async (actual) => ({
  ...(await actual<typeof T_training>()),
  useTrainingLog: () => ({
    log: { climbs: [], hangs: [], activities: [], plan, workout: () => undefined },
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

describe("CalendarMonth", () => {
  it("bands the block's weeks, marks today, and picks a day", () => {
    const onPick = vi.fn();
    const onMonth = vi.fn();
    act(() => root.render(<CalendarMonth month="2026-11-01" onMonth={onMonth} onPick={onPick} />));
    const bands = Array.from(container.querySelectorAll(".block-band--on")).map(
      (b) => b.textContent
    );
    expect(bands[0]).toContain("Winter base");
    expect(bands).toHaveLength(4);
    expect(container.querySelector(".calendar-day-number.is-today")?.textContent).toBe("12");
    const days = Array.from(container.querySelectorAll<HTMLButtonElement>(".calendar-day"));
    act(() => days.find((d) => d.textContent === "20")?.click());
    expect(onPick).toHaveBeenCalledWith("2026-11-20");
    act(() => container.querySelectorAll<HTMLButtonElement>(".month-calendar-step")[1]?.click());
    expect(onMonth).toHaveBeenCalledWith("2026-12-01");
  });
});
