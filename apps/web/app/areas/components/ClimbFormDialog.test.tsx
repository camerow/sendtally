import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AreaClimb, AreaSummary, SendtallyApi } from "@sendtally/api-client";
import { ClimbFormDialog } from "./ClimbFormDialog";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const area = { id: "a1", name: "Buttermilks", slug: "buttermilks" } as AreaSummary;
const lookalike = { id: "c9", name: "Mandala", slug: "mandala", grade_value: "V12" } as AreaClimb;

function fakeApi(): SendtallyApi & {
  similarAreaClimbs: ReturnType<typeof vi.fn>;
  createAreaClimb: ReturnType<typeof vi.fn>;
} {
  return {
    status: vi.fn(() => Promise.resolve({ gradeScales: { boulder: "v", route: "yds" } })),
    similarAreaClimbs: vi.fn(() => Promise.resolve({ candidates: [lookalike] })),
    createAreaClimb: vi.fn(() =>
      Promise.resolve({ climb: { ...lookalike, id: "c1", slug: "the-mandala" } })
    ),
  } as unknown as SendtallyApi & {
    similarAreaClimbs: ReturnType<typeof vi.fn>;
    createAreaClimb: ReturnType<typeof vi.fn>;
  };
}

function type(input: HTMLInputElement, value: string): void {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

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

describe("ClimbFormDialog", () => {
  it("shows look-alikes first, then creates on 'Yes, it's new'", async () => {
    const api = fakeApi();
    act(() =>
      root.render(
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter>
            <ClimbFormDialog
              mode="create"
              api={api}
              area={area}
              onClose={() => {}}
              onSuggested={() => {}}
            />
          </MemoryRouter>
        </QueryClientProvider>
      )
    );
    expect(container.textContent).toContain("You're sharing this under CC0.");
    type(container.querySelector<HTMLInputElement>("#climb-name")!, "The Mandala");

    await act(async () => button("Save").click());
    expect(api.similarAreaClimbs).toHaveBeenCalledWith("a1", "The Mandala");
    expect(api.createAreaClimb).not.toHaveBeenCalled();
    expect(container.textContent).toContain("Is it one of these?");
    expect(container.querySelector("a.area-candidate")?.getAttribute("href")).toBe(
      "/app/climbs/mandala"
    );

    await act(async () => button("Yes, it's new").click());
    expect(api.createAreaClimb).toHaveBeenCalledWith(
      expect.objectContaining({ areaId: "a1", name: "The Mandala", confirmedNew: true })
    );
  });
});
