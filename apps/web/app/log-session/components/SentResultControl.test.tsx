import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { ClimbSummary } from "@sendtally/api-client";
import { newClimb, type ClimbDraft } from "@sendtally/features/log-session";
import { SentResultControl } from "./SentResultControl";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function mount(
  climb: ClimbDraft,
  onChange: (climb: ClimbDraft) => void = () => {},
  summary?: ClimbSummary
): HTMLDivElement {
  act(() => root.render(<SentResultControl climb={climb} summary={summary} onChange={onChange} />));
  return container;
}

function click(el: Element | null): void {
  act(() => (el as HTMLElement).click());
}

const boulder: ClimbDraft = { ...newClimb("c", "v"), kind: "send" };
const route: ClimbDraft = { ...newClimb("c", "yds"), kind: "send", style: "onsight" };

describe("SentResultControl", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("names a one-try boulder send a flash and shows the send count", () => {
    const el = mount({ ...boulder, style: "flash" }, () => {}, {
      sends: 3,
    } as ClimbSummary);
    expect(el.textContent).toContain("Flash");
    expect(el.textContent).toContain("3 sends");
    expect(el.querySelector("[role=radiogroup]")).toBeNull();
  });

  it("reads no sends yet for a climb never sent", () => {
    const el = mount(boulder, () => {}, { sends: 0 } as ClimbSummary);
    expect(el.textContent).toContain("No sends yet");
  });

  it("switching Sent off makes an attempt and keeps the tries", () => {
    const onChange = vi.fn();
    const el = mount({ ...boulder, tries: 3 }, onChange);
    click(el.querySelector(".climb-switch"));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ kind: "attempt", tries: 3 }));
  });

  it("switching Sent on at one try onsights a route by default", () => {
    const onChange = vi.fn();
    const el = mount({ ...newClimb("c", "yds"), kind: "attempt" }, onChange);
    click(el.querySelector(".climb-switch"));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "send", style: "onsight", tries: 1 })
    );
  });

  it("bumping tries collapses a flash to a redpoint", () => {
    const onChange = vi.fn();
    const el = mount({ ...boulder, style: "flash" }, onChange);
    click(el.querySelector("[aria-label='More tries']"));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "send", style: "redpoint", tries: 2 })
    );
  });

  it("dropping back to one try restores the picked route style", () => {
    const onChange = vi.fn();
    const el = mount({ ...route, style: "redpoint", tries: 2 }, onChange);
    click(el.querySelector("[aria-label='Fewer tries']"));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "send", style: "onsight", tries: 1 })
    );
  });

  it("offers Onsight and Flash for a one-try route send", () => {
    const onChange = vi.fn();
    const el = mount(route, onChange);
    const radios = el.querySelectorAll<HTMLInputElement>("[role=radiogroup] input");
    expect([...radios].map((r) => r.value)).toEqual(["onsight", "flash"]);
    expect(radios[0]!.checked).toBe(true);
    click(radios[1]!);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ style: "flash", tries: 1 }));
  });

  it("hides the style choice once a route is an attempt", () => {
    const el = mount({ ...route, kind: "attempt" });
    expect(el.querySelector("[role=radiogroup]")).toBeNull();
    expect(el.textContent).toContain("Attempt");
  });
});
