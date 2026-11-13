import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router";
import type { StravaState } from "@sendtally/features/activities";
import { ToastProvider } from "../../components/Toast";
import { SessionDetail } from "./SessionDetail";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute("open", "");
};

const run = vi.fn();
const deleteLoggedSession = vi.fn(() => Promise.resolve());
let strava: StravaState | null = null;
let editable = true;

vi.mock("../../lib/useAppApi", () => ({ useAppApi: () => ({ deleteLoggedSession }) }));
const liveStorage = vi.hoisted(() => ({
  read: () => null,
  write: () => true,
  remove: () => undefined,
  subscribe: () => () => undefined,
  changed: () => undefined,
}));
vi.mock("../../lib/useLiveSessionStorage", () => ({ useLiveSessionStorage: () => liveStorage }));
vi.mock("@sendtally/features/session-detail", () => ({
  CLIMB_SORTS: ["order"],
  climbSortLabel: () => "Order",
  useSessionDetail: () => ({
    state: {
      status: "ready",
      data: {
        vm: {
          name: "Tuesday night session",
          place: "The Depot",
          when: "Tue Nov 10 · 6:00 PM · 1h 30m",
          rpe: 7,
          startDay: "2026-11-10",
          editable,
          areas: [],
          climbAreas: false,
          pyramid: [{ gradeLabel: "V4", inner: 2, outer: 1, countLabel: "2/3" }],
          filterCounts: { all: 3, sent: 2, flash: 1, project: 1 },
        },
        climbs: [],
        entries: [],
        strava,
      },
    },
    sort: "order",
    setSort: vi.fn(),
    post: { busy: false, error: null, run, refresh: vi.fn() },
    saveNote: vi.fn(),
    deleteNote: vi.fn(),
    reload: vi.fn(),
  }),
}));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  window.matchMedia = vi.fn(() => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
  vi.clearAllMocks();
  strava = null;
  editable = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function Where(): React.ReactElement {
  return <span data-where>{useLocation().pathname}</span>;
}

function render(): void {
  act(() =>
    root.render(
      <MemoryRouter initialEntries={["/app/sessions/manual-1"]}>
        <ToastProvider>
          <SessionDetail fingerprint="manual-1" />
        </ToastProvider>
        <Where />
      </MemoryRouter>
    )
  );
}

const openMenu = (): void =>
  act(() => container.querySelector<HTMLButtonElement>("button[aria-label='More']")?.click());

const menuLabels = (): string[] =>
  [...document.querySelectorAll("[role=menuitem]")].map((b) => b.textContent ?? "");

const menuItem = (label: string): HTMLButtonElement | undefined =>
  [...document.querySelectorAll<HTMLButtonElement>("[role=menuitem]")].find(
    (b) => b.textContent === label
  );

describe("SessionDetail", () => {
  it("leads with mobile's hero, the Climbs, Effort and Sent tiles, and the pyramid legend", () => {
    render();
    expect(container.querySelector("h1")?.textContent).toBe("Tuesday night session");
    expect(container.textContent).toContain("The Depot");
    const tiles = [...container.querySelectorAll(".detail-tile")].map((t) => t.textContent);
    expect(tiles).toEqual(["3climbs", "7effort", "2sent"]);
    expect(container.textContent).toContain("SentAttempted");
  });

  it("offers Post to Strava in the menu and posts from it", () => {
    strava = { kind: "post" };
    render();
    openMenu();
    expect(menuLabels()).toEqual(["Edit session", "Post to Strava", "Delete session"]);
    act(() => menuItem("Post to Strava")?.click());
    expect(run).toHaveBeenCalledOnce();
  });

  it("has no Edit for a read-only session and no Strava row before Strava is known", () => {
    editable = false;
    render();
    openMenu();
    expect(menuLabels()).toEqual(["Delete session"]);
  });

  it("warns that a posted session stays on Strava before deleting it", async () => {
    strava = { kind: "posted", url: "https://www.strava.com/activities/1", postedAt: null };
    render();
    openMenu();
    act(() => menuItem("Delete session")?.click());
    const dialog = document.querySelector("dialog");
    expect(dialog?.textContent).toMatch(/Strava/);
    const confirm = [...(dialog?.querySelectorAll("button") ?? [])].find(
      (b) => b.textContent === "Delete"
    );
    await act(async () => confirm?.click());
    expect(deleteLoggedSession).toHaveBeenCalledWith("manual-1");
    expect(container.querySelector("[data-where]")?.textContent).toBe("/app");
    expect(container.textContent).not.toContain("Could not delete");
  });
});
