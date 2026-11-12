import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import type { ClimbSummary, SessionWithClimbs } from "@sendtally/api-client";
import type * as Climbs from "@sendtally/features/climbs";
import type { LogItem } from "@sendtally/features/journal";
import { ClimbingLog } from "./ClimbingLog";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute("open", "");
};

const climb = (over: Partial<ClimbSummary>): ClimbSummary => ({
  id: "c1",
  slug: "the-arete",
  name: "The Arete",
  grade: { scale: "v", value: 5 },
  discipline: "boulder",
  project: true,
  area_climb_id: null,
  area: { id: "a1", name: "The Depot" },
  sessions: 1,
  attempts: 3,
  sends: 0,
  first_at: "2026-11-10T18:00:00Z",
  last_at: "2026-11-10T18:00:00Z",
  sent_at: null,
  notes: [],
  ...over,
});

const CLIMBS = [
  climb({}),
  climb({
    id: "c2",
    slug: "slab",
    name: "Slab",
    grade: { scale: "v", value: 3 },
    project: false,
    sends: 1,
    sent_at: "2026-11-10T18:00:00Z",
  }),
];

let climbs = CLIMBS;

vi.mock("../../lib/useAppApi", () => ({ useAppApi: () => ({}) }));
vi.mock("@sendtally/features/settings", () => ({
  useGradeScalePrefs: () => ({ scales: { boulder: "v", route: "yds" }, ready: true }),
  useDisplayScales: () => ({ boulder: "v", route: "yds" }),
}));
vi.mock("@sendtally/features/climbs", async (original) => ({
  ...(await original<typeof Climbs>()),
  useClimbs: () => ({
    state: { status: "ready", data: { climbs, sessions: [] as SessionWithClimbs[] } },
    reload: vi.fn(),
  }),
}));

let container: HTMLDivElement;
let root: Root;

function Where(): React.ReactElement {
  return <span data-testid="search">{useLocation().search}</span>;
}

function mount(items: LogItem[] = [], at = "/app"): void {
  act(() =>
    root.render(
      <MemoryRouter initialEntries={[at]}>
        <Routes>
          <Route
            path="/app"
            element={
              <>
                <ClimbingLog items={items} />
                <Where />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    )
  );
}

beforeEach(() => {
  climbs = CLIMBS;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const chip = (prefix: string): HTMLButtonElement =>
  Array.from(container.querySelectorAll<HTMLButtonElement>(".chip")).find((b) =>
    b.textContent?.startsWith(prefix)
  )!;
const climbNames = (): string[] =>
  Array.from(container.querySelectorAll(".climb-row-name")).map(
    (n) => n.firstChild?.textContent ?? ""
  );

describe("ClimbingLog", () => {
  it("counts each status and lists the climbs a status keeps, in the URL", () => {
    mount();
    expect(chip("Projects").textContent).toContain("1");
    act(() => chip("Projects").click());
    expect(climbNames()).toEqual(["The Arete"]);
    expect(container.querySelector('[data-testid="search"]')?.textContent).toBe("?status=projects");
    act(() => chip("Sent").click());
    expect(climbNames()).toEqual(["Slab"]);
    act(() => chip("All").click());
    expect(container.querySelector('[data-testid="search"]')?.textContent).toBe("");
  });

  it("lands on Projects from the URL, as /app/projects redirects", () => {
    mount([], "/app?status=projects");
    expect(chip("Projects").getAttribute("aria-pressed")).toBe("true");
    expect(climbNames()).toEqual(["The Arete"]);
  });

  it("searches by name into a flat list, and says when nothing matches", () => {
    mount();
    const input = container.querySelector<HTMLInputElement>('input[type="search"]')!;
    const type = (v: string): void => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, v);
      act(() => input.dispatchEvent(new Event("input", { bubbles: true })));
    };
    type("slab");
    expect(climbNames()).toEqual(["Slab"]);
    type("nothing like it");
    expect(container.querySelector(".climbing-empty")?.textContent).toBe("No climbs match.");
  });

  it("shows the empty state with its ways in, and no search, before anything is logged", () => {
    climbs = [];
    mount();
    expect(container.querySelector(".climbing-search")).toBeNull();
    const hrefs = Array.from(container.querySelectorAll(".log-empty a")).map((a) =>
      a.getAttribute("href")
    );
    expect(hrefs).toEqual(["/app/sessions/new", "/app/log/climbs/new", "/app/import"]);
  });
});
