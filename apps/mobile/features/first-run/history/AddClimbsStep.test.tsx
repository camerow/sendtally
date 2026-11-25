import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import React from "react";
import type { LogSessionInput, SendtallyApi } from "@sendtally/api-client";
import type { Wizard } from "@sendtally/features/settings";
import { AddClimbsStep } from "./AddClimbsStep";

jest.mock("expo-router", () => ({ router: { push: jest.fn(), replace: jest.fn() } }));

const mockLogSession = jest.fn(async (_input: LogSessionInput) => ({ fingerprint: "manual-1" }));

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
    logSession: (input: LogSessionInput) => mockLogSession(input),
  },
  {
    get: (target, key) =>
      key in target
        ? target[key as keyof typeof target]
        : key === "then"
          ? undefined
          : async () => ({}),
  }
) as unknown as SendtallyApi;

const wizard = {
  path: "history",
  step: "H2h",
  canGoBack: true,
  position: { n: 2, total: 3 },
  memory: { way: "by_hand", existingLog: "none" },
  choose: jest.fn(),
  answerLog: jest.fn(),
  setWay: jest.fn(),
  open: jest.fn(),
  next: jest.fn(),
  back: jest.fn(),
  skip: jest.fn(),
  leave: jest.fn(),
  complete: jest.fn(),
  capture: jest.fn(),
} satisfies Wizard;

const show = async (): Promise<void> => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await render(
    <QueryClientProvider client={client}>
      <AddClimbsStep wizard={wizard} api={api} />
    </QueryClientProvider>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("adding climbs by hand", () => {
  it("saves a picked climb on its year and lists it", async () => {
    await show();
    await fireEvent.press(screen.getByText("V4"));
    await fireEvent.press(screen.getByText("Flash"));
    await fireEvent.press(screen.getByText("2023"));
    await fireEvent.press(screen.getByRole("button", { name: "Add climb" }));
    await waitFor(() => expect(wizard.capture).toHaveBeenCalled());
    expect(mockLogSession.mock.calls[0]![0].date).toBe("2023-07-01");
    expect(await screen.findByText("Added · 1")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Add climb" }).props.accessibilityState
    ).toMatchObject({ disabled: true });
  });
});
