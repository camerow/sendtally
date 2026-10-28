import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { Alert, Linking, type AlertButton } from "react-native";
import SessionDetailScreen from "../../app/session/[fingerprint]";

const mockApi = {
  deleteLoggedSession: jest.fn<(fingerprint: string) => Promise<unknown>>(),
};
const mockReload = jest.fn(async () => undefined);
let mockState: unknown;
let mockStravaUrl: string | null = null;

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({ fingerprint: "manual-1" }),
}));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("../../lib/api", () => ({ useApi: () => mockApi }));
jest.mock("../../components/Sheet", () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? children : null,
}));
jest.mock("./SessionTags", () => ({ SessionTags: () => null }));
jest.mock("./PostStatusBar", () => ({ PostStatusBar: () => null }));
jest.mock("../journal/SessionJournal", () => ({ SessionJournal: () => null }));
jest.mock("@sendtally/features/session-detail", () => ({
  ...jest.requireActual<object>("@sendtally/features/session-detail"),
  useSessionDetail: () => ({
    state: mockState,
    filter: "all",
    setFilter: jest.fn(),
    sort: "order",
    setSort: jest.fn(),
    post: { busy: false, error: null, run: jest.fn() },
    reload: mockReload,
  }),
}));

const ready = (): unknown => ({
  status: "ready",
  data: {
    vm: {
      title: "Tuesday night session",
      meta: "Tue 21 Oct",
      area: null,
      pyramid: [],
      stats: [],
      editable: true,
      stravaUrl: mockStravaUrl,
      post: null,
      startDay: "2026-10-21",
      filterCounts: { all: 0, sent: 0, flash: 0, project: 0 },
    },
    climbs: [],
    tags: [],
    entries: [],
    notes: null,
  },
});

beforeEach(() => {
  jest.clearAllMocks();
  mockStravaUrl = null;
  mockState = ready();
});

describe("Climbing session detail", () => {
  it("keeps Back while it fails to load, and retries", async () => {
    mockState = { status: "error", message: "Network down" };
    await render(<SessionDetailScreen />);
    expect(screen.getByText("Back")).toBeTruthy();
    expect(screen.getByText("Could not load this session.")).toBeTruthy();
    expect(screen.getByText("Network down")).toBeTruthy();
    await fireEvent.press(screen.getByText("Try again"));
    expect(mockReload).toHaveBeenCalled();
  });

  it("edits from the bar", async () => {
    await render(<SessionDetailScreen />);
    await fireEvent.press(screen.getByText("Edit"));
    expect(router.push).toHaveBeenCalledWith("/session/manual-1/edit");
  });

  it("views a posted session on Strava from the menu, and says the activity stays there", async () => {
    mockStravaUrl = "https://www.strava.com/activities/9";
    mockState = ready();
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await render(<SessionDetailScreen />);
    await fireEvent.press(screen.getByLabelText("More"));
    expect(screen.getByText("Removes it here; the Strava activity stays")).toBeTruthy();
    await fireEvent.press(screen.getByText("View on Strava"));
    expect(open).toHaveBeenCalledWith("https://www.strava.com/activities/9");
  });

  it("deletes only once confirmed, then goes back", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    mockApi.deleteLoggedSession.mockResolvedValue({ deleted: true });
    await render(<SessionDetailScreen />);
    await fireEvent.press(screen.getByLabelText("More"));
    await fireEvent.press(screen.getByText("Delete session"));
    expect(alert.mock.calls[0]?.[0]).toBe("Delete session?");
    expect(mockApi.deleteLoggedSession).not.toHaveBeenCalled();
    const buttons = (alert.mock.calls[0]?.[2] ?? []) as AlertButton[];
    await act(async () => buttons.find((b) => b.style === "destructive")?.onPress?.());
    expect(mockApi.deleteLoggedSession).toHaveBeenCalledWith("manual-1");
    expect(router.back).toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
    alert.mockRestore();
  });
});
