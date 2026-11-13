import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import type * as LogSession from "@sendtally/features/log-session";
import { liveSessionStorageOf } from "../../lib/useLiveSessionStorage";
import { TallyPage } from "./TallyPage";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute("open", "");
};

const save = vi.fn((..._args: unknown[]) => "manual-1");

vi.mock("@clerk/react-router", () => ({ useAuth: () => ({ userId: "u1" }) }));
vi.mock("../../lib/useAppApi", () => ({
  useAppApi: () => ({
    gyms: async () => ({ gyms: [] }),
    climbs: async () => ({ climbs: [] }),
    sessions: async () => ({ sessions: [], hangSessions: [], activities: [] }),
    status: () => new Promise(() => undefined),
  }),
}));
vi.mock("@sendtally/features/settings", () => ({
  useGradeScalePrefs: () => ({ scales: { boulder: "v", route: "yds" }, ready: true }),
}));
vi.mock("@sendtally/features/log-session", async (original) => ({
  ...(await original<typeof LogSession>()),
  useLocalSessions: () => ({ save, remove: vi.fn() }),
}));

let container: HTMLDivElement;
let root: Root;
const storage = liveSessionStorageOf("u1");

function Where(): React.ReactElement {
  return <span data-testid="where">{useLocation().pathname}</span>;
}

async function mount(at = "/app/sessions/live"): Promise<void> {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[at]}>
          <Routes>
            <Route path="/app/sessions/live" element={<TallyPage />} />
            <Route path="*" element={<Where />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    )
  );
  await act(async () => new Promise((r) => setTimeout(r, 0)));
}

beforeEach(() => {
  save.mockClear();
  storage.remove();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  storage.remove();
});

const button = (label: string): HTMLButtonElement =>
  Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
    (b) => b.textContent === label || b.getAttribute("aria-label") === label
  )!;
const climbs = (): Array<{ grade: string; tries: number; kind: string }> =>
  (
    JSON.parse(storage.read() ?? "{}") as {
      draft?: { climbs: Array<{ grade: string; tries: number; kind: string }> };
    }
  ).draft?.climbs.map(({ grade, tries, kind }) => ({ grade, tries, kind })) ?? [];

describe("TallyPage", () => {
  it("starts a session, and a grade then Fell and Sent log the climb's goes", async () => {
    await mount();
    expect(storage.read()).not.toBeNull();
    expect(button("Fell").disabled).toBe(true);
    act(() => button("V5").click());
    act(() => button("Fell").click());
    expect(climbs()).toEqual([{ grade: "V5", tries: 1, kind: "attempt" }]);
    act(() => button("Sent").click());
    expect(climbs()).toEqual([{ grade: "V5", tries: 2, kind: "send" }]);
    expect(document.querySelectorAll(".tally-fall")).toHaveLength(1);
    expect(document.querySelector(".tally-sent")).not.toBeNull();
  });

  it("takes the last go back with Undo", async () => {
    await mount();
    act(() => button("V4").click());
    act(() => button("Sent").click());
    expect(climbs()).toHaveLength(1);
    act(() => button("Undo").click());
    expect(climbs()).toEqual([]);
  });

  it("finishes with an effort, saves the session and opens it", async () => {
    await mount();
    act(() => button("V4").click());
    act(() => button("Sent").click());
    act(() => button("Finish").click());
    act(() => button("7, Hard").click());
    await act(async () => button("Save").click());
    expect(save).toHaveBeenCalled();
    expect(storage.read()).toBeNull();
    expect(container.querySelector('[data-testid="where"]')?.textContent).toBe(
      "/app/sessions/manual-1"
    );
  });

  it("discards the session only once confirmed", async () => {
    await mount("/app/sessions/live?finish=1");
    act(() => button("Discard session").click());
    expect(storage.read()).not.toBeNull();
    act(() => button("Discard").click());
    expect(storage.read()).toBeNull();
  });
});
