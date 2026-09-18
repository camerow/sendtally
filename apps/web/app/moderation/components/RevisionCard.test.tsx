import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { RevisionItem, SendtallyApi } from "@sendtally/api-client";
import { RevisionCard } from "./RevisionCard";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const revision = {
  id: "r1",
  entity_type: "climb",
  entity_id: "c1",
  slug: "mandala",
  change_summary: "Guidebook says V11",
  created_at: "2026-09-01T00:00:00Z",
  updated_at: "2026-09-01T00:00:00Z",
  base: { name: "Mandala", grade_value: "V12", version: 3 },
  proposed: { name: "The Mandala", grade_value: "V11" },
  current: { name: "Mandala", grade_value: "V13", version: 4 },
  conflicts: [{ field: "grade_value", base: "V12", proposed: "V11", current: "V13" }],
} as unknown as RevisionItem;

const button = (label: string): HTMLButtonElement =>
  [...container.querySelectorAll("button")].find((b) => b.textContent === label)!;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("RevisionCard", () => {
  it("holds approval until every conflict is picked, then sends the pick and version", async () => {
    const approveRevision = vi.fn(() => Promise.resolve({}));
    const api = { approveRevision } as unknown as SendtallyApi;
    act(() =>
      root.render(
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter>
            <RevisionCard api={api} item={revision} />
          </MemoryRouter>
        </QueryClientProvider>
      )
    );
    expect(container.querySelectorAll(".mod-diff-row--conflict")).toHaveLength(1);

    await act(async () => button("Approve").click());
    expect(approveRevision).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Pick a value for every highlighted field first.");

    const radios = container.querySelectorAll<HTMLInputElement>('input[name="r1-grade_value"]');
    act(() => radios[1]!.click());
    await act(async () => button("Approve").click());
    expect(approveRevision).toHaveBeenCalledWith("r1", 4, { grade_value: "V13" });
  });
});
