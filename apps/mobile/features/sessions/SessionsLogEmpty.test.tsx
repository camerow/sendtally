import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import type * as LogSession from "@sendtally/features/log-session";
import { logSegmentStorage } from "../../lib/logSegmentStorage";
import { SessionsLog } from "./SessionsLog";

const mockPush = jest.fn();
const mockStart = jest.fn();

jest.mock("expo-router", () => ({
  router: { push: (to: unknown) => mockPush(to), navigate: (to: unknown) => mockPush(to) },
}));
jest.mock("../../lib/api", () => ({ useApi: () => undefined }));
jest.mock("../../lib/review", () => ({ maybeAskForReview: () => undefined }));
jest.mock("../../lib/setupPrompt", () => ({
  useSetupDismissed: () => ({ dismissed: true, dismiss: () => undefined }),
}));
jest.mock("../climbs/GradeFilterSheet", () => ({ GradeFilterSheet: () => null }));
jest.mock("../live-session/startLiveSession", () => ({ startLiveSession: () => mockStart() }));
jest.mock("../settings/useStravaConnect", () => ({
  useStravaConnect: () => ({ connect: () => undefined, busy: false, error: null }),
}));
jest.mock("../../components/Sheet", () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? children : null,
}));
function mockMemoryStorage(): unknown {
  let value: string | null = null;
  return jest.requireActual<typeof LogSession>("@sendtally/features/log-session").draftStorage({
    read: () => value,
    write: (next) => {
      value = next;
    },
    remove: () => {
      value = null;
    },
  });
}
jest.mock("../../lib/logSegmentStorage", () => ({ logSegmentStorage: mockMemoryStorage() }));
jest.mock("../../lib/liveSessionStorage", () => ({ liveSessionStorage: mockMemoryStorage() }));
jest.mock("@sendtally/features/settings", () => ({
  useSettings: () => ({ ready: false, vm: {}, reload: () => undefined }),
  useGradeScalePrefs: () => ({ scales: { boulder: "v", route: "yds" }, ready: true }),
}));
jest.mock("@sendtally/features/gyms", () => ({ useGyms: () => ({ ready: false, gyms: [] }) }));
jest.mock("@sendtally/features/training", () => ({
  ...jest.requireActual<object>("@sendtally/features/training"),
  useTrainingLog: () => ({ log: { plan: { blocks: [], memberships: [] } } }),
}));
jest.mock("@sendtally/features/query", () => ({
  ...jest.requireActual<object>("@sendtally/features/query"),
  useQueryPair: () => ({
    state: {
      status: "ready",
      data: [{ sessions: [], hangSessions: [], activities: [] }, []],
    },
    refreshFailed: false,
    reload: () => Promise.resolve(),
  }),
}));
jest.mock("@sendtally/features/climbs", () => ({
  ...jest.requireActual<object>("@sendtally/features/climbs"),
  useClimbs: () => ({
    state: { status: "ready", data: { climbs: [], sessions: [], activities: [] } },
    reload: () => Promise.resolve(),
  }),
}));

describe("An empty log", () => {
  beforeEach(() => {
    logSegmentStorage.remove();
    jest.clearAllMocks();
  });

  it("shows Climbing's preview and every way in, without search or the log button", async () => {
    await render(<SessionsLog />);
    expect(screen.getByText("Evening session", { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByLabelText("Search climbs, areas or grades")).toBeNull();
    expect(screen.queryByLabelText("More ways to log")).toBeNull();
    await fireEvent.press(screen.getByText("Live session"));
    expect(mockStart).toHaveBeenCalled();
    await fireEvent.press(screen.getByText("Add climb"));
    expect(mockPush).toHaveBeenCalledWith("/climb/log");
    await fireEvent.press(screen.getByText("Import a log"));
    expect(mockPush).toHaveBeenCalledWith("/import");
  });

  it("starts Training's first workout from Train › Workouts", async () => {
    logSegmentStorage.write("training");
    await render(<SessionsLog />);
    expect(screen.getByText("Max hangs", { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByText("Log a workout")).toBeTruthy();
    expect(screen.queryByText("Trip")).toBeNull();
    await fireEvent.press(screen.getByText("Start a workout"));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(tabs)/train",
      params: { view: "workouts" },
    });
  });
});
