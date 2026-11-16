import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import type { ClimbChange, ClimbSummary } from "@sendtally/api-client";
import { AddClimb } from "./AddClimb";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const arete: ClimbSummary = {
  id: "c1",
  slug: "the-arete",
  name: "The Arete",
  grade: { scale: "v", value: 5 },
  discipline: "boulder",
  project: false,
  area_climb_id: "ac-1",
  area: { id: "a1", name: "The Depot" },
  sessions: 2,
  attempts: 4,
  sends: 1,
  first_at: "2026-09-01T18:00:00Z",
  last_at: "2026-09-08T18:00:00Z",
  sent_at: "2026-09-08T18:00:00Z",
  notes: [],
};

const updateClimb = vi.fn(async (_id: string, _change: ClimbChange) => ({ id: "c1" }));
const logSession = vi.fn();

vi.mock("../../lib/useAppApi", () => {
  const api = new Proxy(
    {
      climbs: async () => ({ climbs: [arete] }),
      sessionsWithClimbs: async () => ({ sessions: [], hangSessions: [], activities: [] }),
      updateClimb: (id: string, change: ClimbChange) => updateClimb(id, change),
      logSession: (...args: unknown[]) => logSession(...args),
    },
    {
      get: (target, key) => {
        if (key in target) return target[key as keyof typeof target];
        return key === "then" ? undefined : async () => ({ areas: [], climbs: [], activities: [] });
      },
    }
  );
  return { useAppApi: () => api };
});
vi.mock("@sendtally/features/settings", () => ({
  useGradeScalePrefs: () => ({ scales: { boulder: "v", route: "yds" }, ready: true }),
}));

let container: HTMLDivElement;
let root: Root;

function Where(): React.ReactElement {
  const { pathname } = useLocation();
  return <span data-testid="where">{pathname}</span>;
}

async function mount(search: string): Promise<void> {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[`/app/log/climbs/new${search}`]}>
          <Routes>
            <Route path="/app/log/climbs/new" element={<AddClimb />} />
            <Route path="*" element={<Where />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )
  );
  await act(async () => new Promise((r) => setTimeout(r, 0)));
}

beforeEach(() => {
  vi.clearAllMocks();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const text = (): string => container.textContent ?? "";
const button = (label: string): HTMLButtonElement =>
  Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(
    (b) => b.textContent === label
  )!;
const inputs = (): string[] => Array.from(container.querySelectorAll("input")).map((i) => i.value);
const projectSwitch = (): HTMLInputElement =>
  container.querySelector<HTMLInputElement>('.add-climb-row input[role="switch"]')!;

function type(el: HTMLInputElement, value: string): void {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(el, value);
  act(() => el.dispatchEvent(new Event("input", { bubbles: true })));
}

async function save(): Promise<void> {
  await act(async () => button("Save").click());
  await act(async () => new Promise((r) => setTimeout(r, 0)));
}

describe("editing a climb", () => {
  it("edits only the climb itself: name, crag, grade and project", async () => {
    await mount("?climbId=c1&edit=1");
    expect(text()).toContain("Edit climb");
    expect(inputs()).toEqual(expect.arrayContaining(["The Arete", "The Depot"]));
    expect(text()).not.toContain("Date");
    expect(text()).not.toContain("Pinned to the top until you send it");
    expect(projectSwitch().checked).toBe(false);
  });

  it("marks a sent climb as a project with the edit", async () => {
    await mount("?climbId=c1&edit=1");
    act(() => projectSwitch().click());
    await save();
    expect(updateClimb).toHaveBeenLastCalledWith("c1", {
      areaId: "a1",
      areaClimbId: "ac-1",
      working: true,
    });
  });

  it("saves a new grade, keeps its crag and link, and goes back to the climb", async () => {
    await mount("?climbId=c1&edit=1");
    act(() => button("V6").click());
    await save();
    expect(updateClimb).toHaveBeenCalledWith("c1", {
      areaId: "a1",
      areaClimbId: "ac-1",
      grade: { scale: "v", value: 6 },
    });
    expect(logSession).not.toHaveBeenCalled();
    expect(container.querySelector('[data-testid="where"]')?.textContent).toBe(
      "/app/log/climbs/c1"
    );
  });

  it("drops the Areas climb link when the crag is cleared", async () => {
    await mount("?climbId=c1&edit=1");
    const crag = Array.from(container.querySelectorAll("input")).find(
      (i) => i.value === "The Depot"
    )!;
    type(crag, "");
    await save();
    expect(updateClimb).toHaveBeenLastCalledWith("c1", { areaId: null, areaClimbId: null });
  });
});

describe("logging a session on a climb", () => {
  it("heads the page with the climb and asks only for the date, result and notes", async () => {
    await mount("?climbId=c1");
    expect(container.querySelector("h1")?.textContent).toBe("The Arete, V5");
    for (const asked of ["Date", "Notes", "Tries"]) expect(text()).toContain(asked);
    expect(inputs()).not.toContain("The Arete");
    expect(inputs()).not.toContain("The Depot");
    for (const notAsked of ["Grade", "Project"]) expect(text()).not.toContain(notAsked);
  });
});

describe("adding a climb", () => {
  it("asks for everything, Project on, and saves only once named and graded", async () => {
    await mount("");
    expect(container.querySelector("h1")?.textContent).toBe("Add climb");
    expect(projectSwitch().checked).toBe(true);
    expect(button("Save").disabled).toBe(true);
    type(container.querySelector<HTMLInputElement>('input[aria-label="Climb"]')!, "Slab");
    act(() => button("V3").click());
    expect(button("Save").disabled).toBe(false);
  });
});
