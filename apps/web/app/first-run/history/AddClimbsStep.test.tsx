import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import type { LogSessionInput, SendtallyApi } from "@sendtally/api-client";
import type { Wizard } from "@sendtally/features/settings";
import { AddClimbsStep } from "./AddClimbsStep";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const logSession = vi.fn(async (_input: LogSessionInput) => ({ fingerprint: "manual-1" }));

const api = new Proxy(
  {
    sessions: async () => ({ sessions: [] }),
    climbs: async () => ({ climbs: [] }),
    sessionsWithClimbs: async () => ({
      sessions: [],
      hangSessions: [],
      hangParts: [],
      activities: [],
    }),
    logSession: (input: LogSessionInput) => logSession(input),
  },
  {
    get: (target, key) =>
      key in target
        ? target[key as keyof typeof target]
        : key === "then"
          ? undefined
          : async () => ({ areas: [], climbs: [], activities: [] }),
  }
) as unknown as SendtallyApi;

const wizard = {
  path: "history",
  step: "H2h",
  canGoBack: true,
  position: { n: 2, total: 5 },
  memory: { way: "by_hand", existingLog: "none" },
  choose: vi.fn(),
  answerLog: vi.fn(),
  setWay: vi.fn(),
  open: vi.fn(),
  next: vi.fn(),
  back: vi.fn(),
  skip: vi.fn(),
  leave: vi.fn(),
  complete: vi.fn(),
  capture: vi.fn(),
} satisfies Wizard;

let container: HTMLDivElement;
let root: Root;

const settle = (): Promise<void> => act(async () => new Promise((r) => setTimeout(r, 0)));

async function show(): Promise<void> {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <AddClimbsStep wizard={wizard} api={api} />
        </MemoryRouter>
      </QueryClientProvider>
    )
  );
  await settle();
}

const button = (text: string): HTMLButtonElement => {
  const found = [...container.querySelectorAll("button")].find(
    (b) => b.textContent?.trim() === text
  );
  if (found === undefined) throw new Error(`No button "${text}"`);
  return found;
};

const press = async (text: string): Promise<void> => {
  await act(async () => button(text).click());
  await settle();
};

beforeEach(() => {
  vi.clearAllMocks();
  window.matchMedia = vi.fn(() => ({ matches: true })) as unknown as typeof window.matchMedia;
  Element.prototype.scrollIntoView = vi.fn();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("adding climbs by hand", () => {
  it("saves a picked climb on its year, lists it and scrolls the card into view", async () => {
    await show();
    await press("V4");
    await press("Flash");
    await press("2023");
    await press("Add climb");
    await vi.waitFor(() => expect(wizard.capture).toHaveBeenCalled());
    expect(logSession.mock.calls[0]![0].date).toBe("2023-07-01");
    await settle();
    expect(container.textContent).toContain("Added · 1");
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "auto",
      block: "start",
    });
    expect(button("Add climb").disabled).toBe(true);
  });
});
