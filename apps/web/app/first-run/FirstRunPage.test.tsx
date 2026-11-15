import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FirstRunPage } from "./FirstRunPage";

const finish = vi.hoisted(() => vi.fn(async () => undefined));
const saveMembership = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock("../lib/useAppApi", () => ({ useAppApi: () => ({ finishFirstRun: finish }) }));
vi.mock("../training/data/useToday", () => ({ useToday: () => "2026-11-15" }));
vi.mock("../training/data/usePlanActions", () => ({ usePlanActions: () => ({ saveMembership }) }));

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

let root: Root;
let host: HTMLDivElement;
const seen = vi.fn((_path: string) => undefined);
const path = (): string => seen.mock.lastCall?.[0] ?? "";

function Where(): null {
  const location = useLocation();
  seen(location.pathname + location.search);
  return null;
}

const render = (at: string): void =>
  act(() =>
    root.render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={[at]}>
          <Routes>
            <Route path="/app/start" element={<FirstRunPage />} />
            <Route path="*" element={null} />
          </Routes>
          <Where />
        </MemoryRouter>
      </QueryClientProvider>
    )
  );

const click = (text: string): void => {
  const el = [...host.querySelectorAll<HTMLElement>("button, [role=radio]")].find(
    (b) => b.textContent?.trim() === text || b.getAttribute("aria-label") === text
  );
  if (el === undefined) throw new Error(`no ${text}`);
  act(() => el.click());
};

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div");
  root = createRoot(host);
  vi.clearAllMocks();
  vi.stubGlobal("crypto", { randomUUID: () => "m-new" });
});
afterEach(() => {
  act(() => root.unmount());
  vi.unstubAllGlobals();
});

describe("first run on the web", () => {
  it("imports from the picked source, coming back here", () => {
    render("/app/start");
    click("Mountain Project");
    click("Import from Mountain Project");
    expect(path()).toBe("/app/import?then=/app/start");
  });

  it("saves the climbing days as one Ongoing Climbing week and goes to Plan with the import", () => {
    render("/app/start?imported=5&skipped=0&likely=0");
    click("Tuesday");
    click("Sunday");
    click("Continue");
    expect(saveMembership).toHaveBeenCalledWith({
      id: "m-new",
      workoutId: "climb-session",
      blockId: null,
      weekdays: [1, 6],
      start: "2026-11-15",
      position: 0,
    });
    expect(finish).toHaveBeenCalledWith({
      existingLog: "skipped",
      climbingDays: 2,
      endedAt: "plan",
    });
    expect(path()).toBe("/app/plan?imported=5&skipped=0&likely=0");
  });

  it("skips to Log from the first question, saving nothing", () => {
    render("/app/start");
    click("Skip");
    expect(saveMembership).not.toHaveBeenCalled();
    expect(finish).toHaveBeenCalledWith({
      existingLog: "skipped",
      climbingDays: 0,
      endedAt: "skip_log",
    });
    expect(path()).toBe("/app");
  });
});
