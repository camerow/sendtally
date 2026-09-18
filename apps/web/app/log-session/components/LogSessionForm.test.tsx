import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AreaClimb, SendtallyApi } from "@sendtally/api-client";
import type { LogSessionDraft } from "@sendtally/features/log-session";
import { LogSessionForm } from "./LogSessionForm";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

const mandala = {
  id: "c1",
  name: "The Mandala",
  slug: "the-mandala",
  grade_scale: "v",
  grade_value: "V12",
  status: "active",
} as AreaClimb;

const draft: LogSessionDraft = {
  name: "",
  date: "2026-09-18",
  startTime: "10:00",
  endTime: "12:00",
  location: "outdoor",
  area: { id: "a1", name: "Buttermilks" },
  tags: [],
  notes: "",
  rpe: null,
  climbs: [
    {
      key: "climb-1",
      scale: "v",
      grade: "V3",
      name: "",
      kind: "send",
      style: "redpoint",
      tries: 1,
      note: "",
    },
  ],
};

function fakeApi(): SendtallyApi & { updateLoggedSession: ReturnType<typeof vi.fn> } {
  return {
    status: vi.fn(() => Promise.resolve({ gradeScales: { boulder: "v", route: "yds" } })),
    climbs: vi.fn(() => Promise.resolve({ climbs: [] })),
    gyms: vi.fn(() => Promise.resolve({ gyms: [] })),
    tags: vi.fn(() => Promise.resolve({ tags: [] })),
    searchAreas: vi.fn(() => Promise.resolve({ areas: [] })),
    searchAreaClimbs: vi.fn(() => Promise.resolve({ climbs: [mandala] })),
    updateLoggedSession: vi.fn(() => Promise.resolve({ session: { fingerprint: "manual-1" } })),
  } as unknown as SendtallyApi & { updateLoggedSession: ReturnType<typeof vi.fn> };
}

function type(input: HTMLInputElement, value: string): void {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

const settle = (): Promise<void> => act(() => new Promise<void>((r) => setTimeout(r, 400)));

const nameInput = (): HTMLInputElement =>
  container.querySelector<HTMLInputElement>('input[placeholder="Name (optional)"]') ??
  [...container.querySelectorAll<HTMLInputElement>("input[role=combobox]")].pop()!;

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

function render(api: SendtallyApi): void {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  act(() =>
    root.render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <LogSessionForm api={api} editing={{ fingerprint: "manual-1", draft }} />
        </MemoryRouter>
      </QueryClientProvider>
    )
  );
}

async function pickMandala(api: SendtallyApi): Promise<void> {
  render(api);
  await settle();
  act(() => nameInput().focus());
  type(nameInput(), "mand");
  await settle();
  const option = [...container.querySelectorAll("[role=option]")].find((o) =>
    o.textContent?.includes("The Mandala")
  )!;
  act(() => (option as HTMLElement).click());
}

async function save(): Promise<void> {
  const button = [...container.querySelectorAll("button")].find(
    (b) => b.textContent === "Save changes"
  )!;
  await act(async () => button.click());
}

describe("LogSessionForm with Areas", () => {
  it("searches Areas climbs in the crag and sends the pick as a link", async () => {
    const api = fakeApi();
    await pickMandala(api);
    expect(api.searchAreaClimbs).toHaveBeenCalledWith("mand", "a1");
    expect(nameInput().value).toBe("The Mandala");
    await save();
    const [, input] = api.updateLoggedSession.mock.calls[0]!;
    expect(input.areaId).toBe("a1");
    expect(input.climbs[0]).toMatchObject({ name: "The Mandala", climbId: "c1" });
  });

  it("drops the link when the name is retyped, keeping it as free text", async () => {
    const api = fakeApi();
    await pickMandala(api);
    type(nameInput(), "The Mandala sit");
    await save();
    const [, input] = api.updateLoggedSession.mock.calls[0]!;
    expect(input.climbs[0].name).toBe("The Mandala sit");
    expect(input.climbs[0]).not.toHaveProperty("climbId");
  });
});
