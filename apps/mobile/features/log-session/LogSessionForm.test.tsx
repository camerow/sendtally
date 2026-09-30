import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { LogSessionInput } from "@sendtally/api-client";
import type * as LogSession from "@sendtally/features/log-session";
import { LogSessionForm } from "./LogSessionForm";

const mockLogSession = jest.fn(async (input: LogSessionInput) => ({
  session: { fingerprint: "manual-1", input },
}));
const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  router: { replace: (path: string) => mockReplace(path), back: jest.fn(), push: jest.fn() },
  useLocalSearchParams: () => ({}),
}));
jest.mock("../../lib/api", () => {
  const api = new Proxy(
    { logSession: (input: LogSessionInput) => mockLogSession(input) },
    {
      get: (target, key) => {
        if (key in target) return target[key as keyof typeof target];
        return key === "then" ? undefined : async () => ({ tags: [], climbs: [], gyms: [] });
      },
    }
  );
  return { useApi: () => api };
});
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
jest.mock("../../lib/liveSessionStorage", () => ({
  liveSessionStorage: jest
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

/** The sheet's Done confirms the picker; the form's own Done is the save button. */
const pickerDone = () => screen.getAllByText("Done")[0]!;
const saveButton = () => screen.getAllByText("Done").at(-1)!;

describe("saving a new session", () => {
  it("saves with no times, offered under the date rather than filled in", async () => {
    await renderForm();
    expect(screen.queryByLabelText("Start")).toBeNull();
    screen.getByText("+ Add start and end time");

    await fireEvent.press(saveButton());

    expect(mockLogSession).toHaveBeenCalledTimes(1);
    expect(mockLogSession.mock.calls[0]![0]).not.toHaveProperty("startTime");
    expect(mockLogSession.mock.calls[0]![0]).not.toHaveProperty("endTime");
    expect(mockReplace).toHaveBeenCalledWith("/session/manual-1");
  });

  it("saves after opening both time pickers but only confirming the start", async () => {
    await renderForm();
    await fireEvent.press(screen.getByText("+ Add start and end time"));
    await fireEvent.press(screen.getByLabelText("Start"));
    await fireEvent.press(pickerDone());
    await fireEvent.press(screen.getByLabelText("End"));

    await fireEvent.press(saveButton());

    expect(screen.queryByText("End time is before the start time.")).toBeNull();
    expect(mockLogSession).toHaveBeenCalledTimes(1);
    expect(mockLogSession.mock.calls[0]![0].startTime).toMatch(/^\d{2}:\d{2}$/);
    expect(mockLogSession.mock.calls[0]![0]).not.toHaveProperty("endTime");
  });
});
