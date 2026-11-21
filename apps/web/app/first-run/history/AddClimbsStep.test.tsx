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
  memory: { way: "by_hand", existingLog: "none", days: [], membershipShown: false },
  choose: vi.fn(),
  answerLog: vi.fn(),
  setWay: vi.fn(),
  setDays: vi.fn(),
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
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe("adding climbs by hand", () => {
  it("asks a project for its name before it can be added", async () => {
    await show();
    await press("V4");
    await press("Project");
    expect(container.textContent).toContain("A project needs its name.");
    expect(button("Add climb").disabled).toBe(true);
  });

  it("saves an unnamed flash on 1 July of its year and counts it", async () => {
    await show();
    await press("V4");
    await press("Flash");
    await press("2023");
    await press("Add climb");
    await vi.waitFor(() => expect(wizard.capture).toHaveBeenCalled());
    const input = logSession.mock.calls[0]![0];
    expect(input.date).toBe("2023-07-01");
    expect(input.climbs[0]).toMatchObject({ kind: "send", style: "flash", tries: 1 });
    expect(input.climbs[0]?.name ?? "").toBe("");
    expect(wizard.capture).toHaveBeenCalledWith("climb_added", {
      kind: "boulder",
      outcome: "flash",
      dated: "year",
    });
    await settle();
    expect(container.textContent).toContain("Added · 1");
    expect(button("Add climb").disabled).toBe(true);
  });
});
