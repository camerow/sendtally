import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { newClimb, type StoredSessionDraft } from "@sendtally/features/log-session";
import { DiscardDraftDialog } from "./DiscardDraftDialog";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute("open", "");
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  window.matchMedia = vi.fn(() => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })) as unknown as typeof window.matchMedia;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const stored = {
  draft: { climbs: [newClimb("c1", "v")] },
  savedAt: new Date(2026, 10, 12, 16, 26),
} as unknown as StoredSessionDraft;

const button = (text: string): HTMLButtonElement | undefined =>
  [...container.querySelectorAll("button")].find((b) => b.textContent === text);

describe("DiscardDraftDialog", () => {
  it("asks with the climb count and day, and Discard is the red outline", () => {
    act(() =>
      root.render(<DiscardDraftDialog stored={stored} onCancel={() => {}} onDiscard={() => {}} />)
    );
    expect(container.textContent).toContain("Discard this draft?");
    expect(container.textContent).toContain("Thursday");
    expect(button("Discard")?.className).toContain("sheet-action--danger");
  });

  it("cancels and discards", () => {
    const onCancel = vi.fn();
    const onDiscard = vi.fn();
    act(() =>
      root.render(<DiscardDraftDialog stored={stored} onCancel={onCancel} onDiscard={onDiscard} />)
    );
    act(() => button("Cancel")?.click());
    expect(onCancel).toHaveBeenCalledOnce();
    act(() => button("Discard")?.click());
    expect(onDiscard).toHaveBeenCalledOnce();
  });
});
