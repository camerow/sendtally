import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act, StrictMode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation, useParams } from "react-router";
import type { Plan, WorkoutRecord } from "@sendtally/api-client";
import type { Block, Weekday } from "@sendtally/core/hang";
import { hangModel } from "@sendtally/features/hang";
import { libraryOf, type WorkoutLibrary } from "@sendtally/features/workouts";
import { ToastProvider } from "../../components/Toast";
import { hangData } from "../data/testHang";
import { BlockPage } from "./BlockPage";

import type * as T_training from "@sendtally/features/training";
import type * as T_useLibrary from "../library/useLibrary";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute("open", "");
};

const TODAY = "2026-11-12";

const legs: WorkoutRecord = {
  id: "legs",
  kind: "strength",
  name: "Gym, legs",
  description: "",
  minutes: 50,
  targetRpe: null,
  items: [{ exercise: "Back squat", doses: [{ sets: 5, reps: 5 }] }],
  exerciseRestS: 180,
  focus: "strength",
  updatedAt: "t",
};

const state = vi.hoisted(() => ({
  plan: null as unknown as Plan,
  saveBlock: vi.fn(async () => undefined),
  deleteBlock: vi.fn(async () => undefined),
  saveDraft: vi.fn(async () => undefined),
  copyBlock: vi.fn(async () => true),
  saveMembership: vi.fn(async () => undefined),
  deleteMembership: vi.fn(async () => undefined),
}));

const library = (): WorkoutLibrary => {
  const workouts = libraryOf([legs]);
  return { workouts, usage: new Map(), workout: (id) => workouts.find((w) => w.id === id) };
};

vi.mock("../library/useLibrary", async (actual) => ({
  ...(await actual<typeof T_useLibrary>()),
  useLibrary: () => ({ state: { status: "ready", data: library() }, reload: vi.fn() }),
}));
vi.mock("../../lib/useAppApi", () => ({ useAppApi: () => ({}) }));
vi.mock("../data/HangDataContext", () => ({
  useHangData: () => ({ model: hangModel(hangData(), libraryOf([])), today: TODAY }),
}));
vi.mock("@sendtally/features/training", async (actual) => ({
  ...(await actual<typeof T_training>()),
  usePlan: () => ({ state: { status: "ready", data: state.plan }, reload: vi.fn() }),
  useTrainingLog: () => ({
    log: {
      climbs: [],
      hangs: [],
      activities: [],
      plan: state.plan,
      workout: (id: string) => libraryOf([legs]).find((w) => w.id === id),
    },
    ready: true,
  }),
  usePlanActions: () => state,
  useAddTo: () => ({ add: vi.fn(), undo: vi.fn(), plans: [] }),
}));

const template: Block = { id: "b1", name: "Power phase", start: null, weeks: 4, focus: null };
// Monday to two Sundays on, running this week.
const running: Block = { ...template, start: "2026-11-09", weeks: 2 };
const over: Block = { ...template, start: "2026-10-05", weeks: 2 };

const withBlock = (block: Block, weekdays: Weekday[] = [3]): Plan => ({
  blocks: [block],
  memberships: [
    {
      id: "m1",
      workoutId: "legs",
      blockId: block.id,
      weekdays,
      start: block.start ?? TODAY,
      position: 0,
    },
  ],
  weekChanges: [],
  planChanges: [],
  membershipDays: [],
});

let container: HTMLDivElement;
let root: Root;
const at = { path: "" };

function Spy(): null {
  const path = useLocation().pathname;
  React.useEffect(() => {
    at.path = path;
  }, [path]);
  return null;
}

function Page({ fresh }: { fresh: boolean }): React.ReactElement {
  return <BlockPage id={useParams().id ?? ""} fresh={fresh} />;
}

const mount = (fresh = false): void =>
  act(() =>
    root.render(
      <StrictMode>
        <ToastProvider>
          <MemoryRouter initialEntries={["/app/train", "/app/plan/block/b1"]} initialIndex={1}>
            <Spy />
            <Routes>
              <Route path="/app/train" element={<p>Train</p>} />
              <Route path="/app/plan/block/:id" element={<Page fresh={fresh} />} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </StrictMode>
    )
  );

beforeEach(() => {
  vi.clearAllMocks();
  window.matchMedia = vi.fn(() => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
  Element.prototype.scrollIntoView = vi.fn();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const click = (el: Element | null | undefined): void => act(() => (el as HTMLElement).click());

const button = (text: string): HTMLElement | undefined =>
  [...document.querySelectorAll<HTMLElement>("button")].find((b) => b.textContent === text);

const menu = (): string[] => {
  click(document.querySelector('[aria-label="More"]'));
  return [...document.querySelectorAll(".more-item")].map((b) => b.textContent ?? "");
};

const type = (input: HTMLInputElement, value: string): void =>
  act(() => {
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    set?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });

describe("BlockPage", () => {
  it("reads a template: its weeks, its grid, and Schedule from a day", async () => {
    state.plan = withBlock(template);
    mount();
    expect(container.querySelector(".block-title")?.textContent).toBe("Power phase");
    expect(container.querySelector(".block-when")?.textContent).toBe("Not scheduled");
    expect(container.querySelectorAll(".week-chip")).toHaveLength(4);
    expect(container.querySelector(".plan-grid-workout")?.textContent).toBe("Gym, legs");
    click(button("Schedule"));
    click(document.querySelector("dialog .sheet-action"));
    await act(async () => undefined);
    expect(state.copyBlock).toHaveBeenCalledWith("b1", expect.any(String), TODAY);
    const [, copy] = state.copyBlock.mock.calls[0] as unknown as [string, string];
    expect(at.path).toBe(`/app/plan/block/${copy}`);
  });

  it("holds Schedule back while no workout has a day, naming them in Edit", () => {
    state.plan = withBlock(template, []);
    mount();
    expect(button("Schedule")?.hasAttribute("disabled")).toBe(true);
    click(button("Edit"));
    expect(container.querySelector(".block-hint")?.textContent).toContain("Gym, legs");
  });

  it("edits the name, weeks and days together, saved on Save and dropped on Cancel", () => {
    state.plan = withBlock(template);
    mount();
    click(button("Edit"));
    type(container.querySelector<HTMLInputElement>(".block-name-field")!, "Strength");
    click(container.querySelector('[aria-label="Increase Weeks"]'));
    click(container.querySelector('[role="checkbox"][aria-label="Gym, legs, Monday"]'));
    click(button("Cancel"));
    expect(state.saveDraft).not.toHaveBeenCalled();
    expect(container.querySelector(".block-title")?.textContent).toBe("Power phase");

    click(button("Edit"));
    type(container.querySelector<HTMLInputElement>(".block-name-field")!, "Strength");
    click(container.querySelector('[aria-label="Increase Weeks"]'));
    click(container.querySelector('[role="checkbox"][aria-label="Gym, legs, Monday"]'));
    click(button("Save"));
    expect(state.saveDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        block: expect.objectContaining({ name: "Strength", weeks: 5 }),
        schedules: [expect.objectContaining({ membershipId: "m1" })],
      })
    );
  });

  it("removes an untitled empty template it opened fresh, once it is left", async () => {
    state.plan = { ...withBlock({ ...template, name: "" }), memberships: [] };
    mount(true);
    expect(document.activeElement?.classList.contains("block-name-field")).toBe(true);
    await act(async () => new Promise((done) => setTimeout(done)));
    expect(state.deleteBlock).not.toHaveBeenCalled();
    act(() => root.render(<p>gone</p>));
    await act(async () => new Promise((done) => setTimeout(done)));
    expect(state.deleteBlock).toHaveBeenCalledWith("b1");
  });

  it("opens a planned day of a running block, with Reschedule, Skip and Log it", () => {
    state.plan = withBlock(running);
    mount();
    expect(container.querySelector(".detail-tiles")?.textContent).toContain("This week");
    click(container.querySelector('button.grid-cell[aria-label="Gym, legs, Thursday"]'));
    const sheet = document.querySelector("dialog")!;
    expect(sheet.querySelector(".sheet-title")?.textContent).toBe("Gym, legs");
    expect([...sheet.querySelectorAll(".more-item")].map((b) => b.textContent)).toEqual([
      "Reschedule",
      "Skip",
    ]);
    expect(sheet.querySelector(".sheet-action")?.textContent).toBe("Log it");
  });

  it("saves a scheduled block as a template under a name, with View in the toast", async () => {
    state.plan = withBlock(running);
    mount();
    expect(menu()).toEqual(["Save as template", "Delete block"]);
    click(button("Save as template"));
    type(document.querySelector<HTMLInputElement>("dialog .name-field")!, "Power again");
    click(button("Save template"));
    await act(async () => undefined);
    expect(state.copyBlock).toHaveBeenCalledWith("b1", expect.any(String), null);
    expect(state.saveBlock).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Power again", start: null })
    );
    expect(document.querySelector(".toast-message")?.textContent).toBe(
      "Saved “Power again” to templates"
    );
    click(document.querySelector(".toast-action"));
    const [, copy] = state.copyBlock.mock.calls[0] as unknown as [string, string];
    expect(at.path).toBe(`/app/plan/block/${copy}`);
  });

  it("asks before deleting, then goes back", () => {
    state.plan = withBlock(template);
    mount();
    menu();
    click(button("Delete block"));
    expect(state.deleteBlock).not.toHaveBeenCalled();
    click(document.querySelector(".sheet-action--danger"));
    expect(state.deleteBlock).toHaveBeenCalledWith("b1");
    expect(at.path).toBe("/app/train");
  });

  it("recaps a block that is over, with Plan again and no Edit", () => {
    state.plan = withBlock(over);
    mount();
    expect(container.querySelector(".block-finished")?.textContent).toBe("Finished");
    expect(container.querySelectorAll(".week-bar")).toHaveLength(2);
    expect(button("Edit")).toBeUndefined();
    expect(button("Plan again")).toBeDefined();
  });
});
