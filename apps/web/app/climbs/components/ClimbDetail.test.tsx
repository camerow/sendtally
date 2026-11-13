import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { ClimbDetail } from "./ClimbDetail";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute("open", "");
};

const saveNote = vi.fn();
const deleteNote = vi.fn();
const remove = vi.fn();
let project = false;

vi.mock("../../lib/useAppApi", () => ({ useAppApi: () => ({}) }));
vi.mock("@sendtally/features/climbs", () => ({
  useClimb: () => ({
    state: {
      status: "ready",
      data: {
        climb: { id: "c1", slug: "the-arete" },
        vm: {
          id: "c1",
          name: "The Arete",
          title: "The Arete, V5",
          meta: "The Depot · first tried 2 Sep",
          project,
          days: "6",
          tries: "23",
          best: "Flash",
          sessions: [],
          notes: [
            { id: "n1", source: "page", day: "2026-10-30", dateLabel: "Oct 30", note: "Toe hook" },
            {
              id: "manual-9",
              source: "session",
              day: "2026-10-12",
              dateLabel: "Oct 12",
              note: "Wet top out",
            },
          ],
        },
      },
    },
    saveNote,
    deleteNote,
    remove,
    reload: vi.fn(),
  }),
}));

let container: HTMLDivElement;
let root: Root;

function setNarrow(): void {
  window.matchMedia = vi.fn(() => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
}

function Where(): React.ReactElement {
  const { pathname, search } = useLocation();
  return <span data-testid="where">{pathname + search}</span>;
}

beforeEach(() => {
  setNarrow();
  vi.clearAllMocks();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <MemoryRouter initialEntries={["/app/log/climbs/c1"]}>
        <Routes>
          <Route path="/app/log/climbs/c1" element={<ClimbDetail id="c1" />} />
          <Route path="*" element={<Where />} />
        </Routes>
      </MemoryRouter>
    )
  );
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  project = false;
});

const text = (): string => document.body.textContent ?? "";
const button = (label: string): HTMLButtonElement => {
  const found = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
    (b) => b.textContent === label || b.getAttribute("aria-label") === label
  );
  if (found === undefined) throw new Error(`no button ${label}`);
  return found;
};
const note = (body: string): HTMLButtonElement =>
  Array.from(document.querySelectorAll<HTMLButtonElement>(".note-row")).find((b) =>
    b.textContent?.includes(body)
  )!;
const where = (): string | null | undefined =>
  container.querySelector('[data-testid="where"]')?.textContent;

function type(el: HTMLTextAreaElement | HTMLInputElement, value: string): void {
  const proto = Object.getPrototypeOf(el) as object;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, value);
  act(() => el.dispatchEvent(new Event("input", { bubbles: true })));
}

describe("ClimbDetail", () => {
  it("introduces the climb and reads its days, tries and best as tiles", () => {
    for (const s of [
      "The Arete, V5",
      "The Depot · first tried 2 Sep",
      "6Days",
      "23Tries",
      "FlashBest",
    ]) {
      expect(text()).toContain(s);
    }
    expect(text()).not.toContain("Project");
    expect(text()).not.toMatch(/History/);
  });

  it("logs a session on it from the footer", () => {
    act(() => button("Log session").click());
    expect(where()).toBe("/app/log/climbs/new?climbId=c1");
  });

  it("edits the climb from the ··· menu", () => {
    act(() => button("More").click());
    act(() => button("Edit climb").click());
    expect(where()).toBe("/app/log/climbs/new?climbId=c1&edit=1");
  });

  it("deletes the climb from the ··· menu once confirmed", () => {
    act(() => button("More").click());
    act(() => button("Delete climb").click());
    expect(text()).toContain("Delete The Arete? Its sessions stay as logged.");
    expect(remove).not.toHaveBeenCalled();
    act(() => button("Delete").click());
    expect(remove).toHaveBeenCalled();
    expect(where()).toBe("/app");
  });

  it("adds a dated note from the + beside Notes", () => {
    act(() => button("Add a note").click());
    type(document.querySelector("textarea")!, "Heel on the left");
    act(() => button("Save").click());
    expect(saveNote).toHaveBeenCalledWith({ day: expect.any(String), note: "Heel on the left" });
  });

  it("rewrites a note, and deletes it once confirmed", () => {
    act(() => note("Toe hook").click());
    type(document.querySelector("textarea")!, "Toe hook right");
    act(() => button("Save").click());
    expect(saveNote).toHaveBeenCalledWith({
      id: "n1",
      source: "page",
      day: "2026-10-30",
      note: "Toe hook right",
    });
    act(() => note("Toe hook").click());
    act(() => button("Delete note").click());
    act(() => button("Delete").click());
    expect(deleteNote).toHaveBeenCalledWith(expect.objectContaining({ id: "n1", source: "page" }));
  });

  it("keeps a session note on its session's day", () => {
    act(() => note("Wet top out").click());
    expect(text()).toContain("Edit note");
    expect(document.querySelector<HTMLInputElement>('input[type="date"]')?.disabled).toBe(true);
  });

  it("shows Project as a status pill only", () => {
    project = true;
    act(() =>
      root.render(
        <MemoryRouter>
          <ClimbDetail id="c1" />
        </MemoryRouter>
      )
    );
    expect(container.querySelector(".climb-pill")?.textContent).toBe("Project");
    expect(container.querySelector('[role="switch"]')).toBeNull();
  });
});
