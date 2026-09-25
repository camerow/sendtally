import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import type { ClimbVocabulary } from "@sendtally/features/climbs";
import {
  withQuickClimb,
  type LiveSyncStatus,
  type StoredSessionDraft,
} from "@sendtally/features/log-session";
import { LiveSessionCard } from "./LiveSessionCard";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const vocabulary = { isProject: () => false } as unknown as ClimbVocabulary;
const savedAt = new Date(2026, 8, 16, 18, 42);

function stored(fingerprint?: string): StoredSessionDraft {
  return { draft: withQuickClimb(null, savedAt).draft, savedAt, fingerprint };
}

function mount(
  entry: StoredSessionDraft,
  status: LiveSyncStatus = "idle",
  onToggleSent: (key: string) => void = () => {}
): HTMLDivElement {
  act(() =>
    root.render(
      <MemoryRouter>
        <LiveSessionCard
          stored={entry}
          status={status}
          vocabulary={vocabulary}
          gym={{ id: "g", name: "Barn", scale: "v", walls: [], circuits: [] }}
          onEditClimb={() => {}}
          onChangeTries={() => {}}
          onToggleSent={onToggleSent}
        />
      </MemoryRouter>
    )
  );
  return container;
}

describe("LiveSessionCard", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("reads the sync status and gym in the meta line", () => {
    expect(mount(stored(), "saving").querySelector(".live-session-meta-text")?.textContent).toBe(
      "Saving… · Barn"
    );
    expect(mount(stored(), "failed").querySelector(".live-session-meta-text")?.textContent).toBe(
      "Not saved yet, will retry · Barn"
    );
    expect(mount(stored("manual-1")).querySelector(".live-session-meta-text")?.textContent).toBe(
      "Saved as you go · Barn"
    );
  });

  it("links to the session once it is on the server, and not before", () => {
    const before = mount(stored());
    expect(before.querySelector("a")).toBeNull();
    expect(before.querySelector<HTMLButtonElement>(".live-add-details")?.disabled).toBe(true);

    const after = mount(stored("manual-1"));
    const links = [...after.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    expect(links).toEqual(["/app/sessions/manual-1", "/app/sessions/manual-1/edit"]);
  });

  it("toggles a climb between sent and attempt from its mark", () => {
    const onToggleSent = vi.fn();
    const el = mount(stored("manual-1"), "idle", onToggleSent);
    act(() => el.querySelector<HTMLButtonElement>(".climb-ledger-result--toggle")?.click());
    expect(onToggleSent).toHaveBeenCalledWith("climb-1");
  });
});
