import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { LogSessionInput } from "@sendtally/api-client";
import type * as LogSession from "@sendtally/features/log-session";
import { LogSessionForm } from "./LogSessionForm";

const mockLogSession = jest.fn((_input: LogSessionInput, _fingerprint?: string) => "manual-1");
const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  router: { replace: (path: string) => mockReplace(path), back: jest.fn(), push: jest.fn() },
  useLocalSearchParams: () => ({}),
}));
jest.mock("../../lib/api", () => {
  const api = new Proxy(
    {},
    {
      get: (target, key) => {
        if (key in target) return target[key as keyof typeof target];
        return key === "then" ? undefined : async () => ({ tags: [], climbs: [], gyms: [] });
      },
    }
  );
  return { useApi: () => api };
});
jest.mock("../../lib/useSessions", () => ({
  useSessions: () => ({ save: mockLogSession, remove: jest.fn() }),
}));
jest.mock("@sendtally/features/settings", () => ({
  useGradeScalePrefs: () => ({
    scales: jest.requireActual<typeof LogSession>("@sendtally/features/log-session")
      .DEFAULT_GRADE_PREFS,
    ready: true,
  }),
}));
jest.mock("../../lib/sessionDraftStorage", () => ({
  sessionDraftStorage: jest
    .requireActual<typeof LogSession>("@sendtally/features/log-session")
    .draftStorage({ read: () => null, write: () => undefined, remove: () => undefined }),
}));
jest.mock("../../components/Sheet", () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? children : null,
}));
jest.mock("@react-native-community/datetimepicker", () => ({
  __esModule: true,
  default: () => null,
  DateTimePickerAndroid: { open: jest.fn() },
}));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

afterEach(() => queryClient.clear());

beforeEach(() => {
  mockLogSession.mockClear();
  mockReplace.mockClear();
});

async function renderForm(): Promise<void> {
  await render(
    <QueryClientProvider client={queryClient}>
      <LogSessionForm />
    </QueryClientProvider>
  );
}

/** The form's own Done is the save button. */
const saveButton = () => screen.getAllByText("Done").at(-1)!;

describe("saving a new session", () => {
  it("saves with a date and no start or end time", async () => {
    await renderForm();
    expect(screen.queryByLabelText("Start")).toBeNull();
    expect(screen.queryByText("+ Add start and end time")).toBeNull();

    await fireEvent.press(saveButton());

    expect(mockLogSession).toHaveBeenCalledTimes(1);
    expect(mockLogSession.mock.calls[0]![0]).not.toHaveProperty("startTime");
    expect(mockLogSession.mock.calls[0]![0]).not.toHaveProperty("endTime");
    expect(mockReplace).toHaveBeenCalledWith("/session/manual-1");
  });
});
