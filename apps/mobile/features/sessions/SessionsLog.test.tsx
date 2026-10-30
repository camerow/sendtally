import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import type * as LogSession from "@sendtally/features/log-session";
import { logSegmentStorage } from "../../lib/logSegmentStorage";
import { SessionsLog } from "./SessionsLog";

const mockSession = (fingerprint: string, name: string, start: string): object => ({
  fingerprint,
  board: null,
  source: "manual",
  location: "indoor",
  gym_id: null,
  area_id: null,
  name,
  start_at: start,
  end_at: start,
  times: "both",
  climb_count: 1,
  send_count: 1,
  top_grade: 5,
  top_send_grade: 5,
  top_grade_label: null,
  top_send_grade_label: null,
  notes: null,
  rpe: 6,
  rpe_source: "computed",
  title: "T",
  strava_activity_id: null,
  posted_at: null,
  post_state: null,
  post_error: null,
  membership_id: null,
  week: null,
  focus: null,
  tags: [],
});

const mockSummary = (id: string, name: string, at: string, sent: boolean): object => ({
  id,
  slug: id,
  name,
  grade: { scale: "v", value: 4 },
  discipline: "boulder",
  project: false,
  area_climb_id: null,
  area: null,
  sessions: 1,
  attempts: 1,
  sends: sent ? 1 : 0,
  first_at: at,
  last_at: at,
  sent_at: sent ? at : null,
});

const mockNamed = mockSession("s1", "Tuesday night session", "2026-10-21T18:00:00.000Z");
const mockBare = mockSession("s2", "", "2026-10-12T10:00:00.000Z");

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("../../lib/api", () => ({ useApi: () => undefined }));
jest.mock("../../lib/review", () => ({ maybeAskForReview: () => undefined }));
jest.mock("../../lib/setupPrompt", () => ({
  useSetupDismissed: () => ({ dismissed: true, dismiss: () => undefined }),
}));
jest.mock("../app-update/UpdateReadyCard", () => ({ UpdateReadyCard: () => null }));
jest.mock("../climbs/GradeFilterSheet", () => ({ GradeFilterSheet: () => null }));
jest.mock("../live-session/startLiveSession", () => ({ startLiveSession: () => undefined }));
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
      data: [
        {
          sessions: [mockNamed, mockBare],
          hangSessions: [],
          activities: [
            {
              id: "a1",
              kind: "strength",
              title: "Leg day",
              date: "2026-10-20",
              startTime: "18:30",
              minutes: 50,
              rpe: 7,
              notes: null,
              workoutId: null,
              membershipId: null,
              week: null,
              focus: null,
              done: [],
            },
          ],
        },
        [],
      ],
    },
    refreshFailed: false,
    reload: () => Promise.resolve(),
  }),
}));
jest.mock("@sendtally/features/climbs", () => ({
  ...jest.requireActual<object>("@sendtally/features/climbs"),
  useClimbs: () => ({
    state: {
      status: "ready",
      data: {
        climbs: [
          mockSummary("c1", "Pocket Rocket", "2026-10-21T18:00:00.000Z", true),
          mockSummary("c2", "Brad Pit", "2026-10-12T10:00:00.000Z", false),
        ],
        sessions: [
          {
            ...mockNamed,
            climbs: [{ name: "Pocket Rocket", kind: "send", style: "flash", tries: 1 }],
          },
          { ...mockBare, climbs: [{ name: "Brad Pit", kind: "attempt", tries: 3 }] },
        ],
        activities: [],
      },
    },
    reload: () => Promise.resolve(),
  }),
}));

describe("Log", () => {
  beforeEach(() => logSegmentStorage.remove());

  it("opens on Climbing: a named session with its climbs under it, a lone climb on its day", async () => {
    await render(<SessionsLog />);
    expect(screen.getByLabelText(/^Tuesday night session, /)).toBeTruthy();
    expect(screen.getByLabelText("V4, Pocket Rocket, 1 try, Flash")).toBeTruthy();
    expect(screen.getByLabelText("V4, Brad Pit, 12 Oct, 3 tries")).toBeTruthy();
    expect(screen.queryByText("Logged session")).toBeNull();
    expect(screen.queryByText("Leg day")).toBeNull();
    expect(screen.getByText("Start session")).toBeTruthy();
  });

  it("turns into the flat climbs list once searched", async () => {
    await render(<SessionsLog />);
    await fireEvent.changeText(screen.getByLabelText("Search climbs, areas or grades"), "brad");
    expect(screen.queryByLabelText(/^Tuesday night session, /)).toBeNull();
    expect(screen.queryByText("Pocket Rocket")).toBeNull();
    expect(screen.getByText("Brad Pit")).toBeTruthy();
  });

  it("switches to Training, with its own button, and remembers it on the device", async () => {
    await render(<SessionsLog />);
    await fireEvent.press(screen.getByText("Training"));
    expect(screen.getByText("Leg day")).toBeTruthy();
    expect(screen.queryByLabelText(/^Tuesday night session, /)).toBeNull();
    expect(screen.getByText("Log training")).toBeTruthy();
    expect(logSegmentStorage.read()).toBe("training");
    await fireEvent.press(screen.getByLabelText("More ways to log"));
    expect(screen.getByText("Journal")).toBeTruthy();
    expect(screen.queryByText("Add climb")).toBeNull();
  });

  it("opens on the segment last shown", async () => {
    logSegmentStorage.write("training");
    await render(<SessionsLog />);
    expect(screen.getByText("Leg day")).toBeTruthy();
  });

  it("holds Past session and Add climb behind Climbing's arrow", async () => {
    await render(<SessionsLog />);
    await fireEvent.press(screen.getByLabelText("More ways to log"));
    expect(screen.getByText("Past session")).toBeTruthy();
    expect(screen.getByText("Add climb")).toBeTruthy();
    expect(screen.queryByText("Journal")).toBeNull();
  });
});
