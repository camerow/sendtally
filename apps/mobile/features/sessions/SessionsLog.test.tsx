import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import type * as LogSession from "@sendtally/features/log-session";
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
const mockBare = { ...mockSession("s2", "", "2026-10-12T10:00:00.000Z"), rpe_source: "none" };

jest.mock("expo-router", () => ({ router: { push: jest.fn(), setParams: jest.fn() } }));
jest.mock("../../lib/api", () => ({ useApi: () => undefined }));
jest.mock("../../lib/review", () => ({ maybeAskForReview: () => undefined }));
jest.mock("../live-session/startLiveSession", () => ({ startLiveSession: () => undefined }));
jest.mock("../../components/Sheet", () => ({
  Sheet: ({
    visible,
    children,
    footer,
  }: {
    visible: boolean;
    children: React.ReactNode;
    footer?: React.ReactNode;
  }) =>
    visible ? (
      <>
        {children}
        {footer}
      </>
    ) : null,
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
jest.mock("../../lib/liveSessionStorage", () => ({ liveSessionStorage: mockMemoryStorage() }));
let mockScales = { boulder: "v", route: "yds" };
let mockUnit: string | null = "lb";
let mockHangs: object[] = [];
jest.mock("@sendtally/features/activities", () => ({
  ...jest.requireActual<object>("@sendtally/features/activities"),
  useWeightUnit: () => mockUnit,
}));
const mockHang = {
  id: "h1",
  workoutId: "rep73",
  gripId: "half",
  gripName: null,
  date: "2026-10-19",
  loadKg: 4,
  pct: 100,
  misses: 0,
  rpe: 7,
  edgeMm: 20,
  protocol: {
    name: "Repeaters 7:3",
    kind: "hang",
    hangS: 7,
    restS: 3,
    reps: 6,
    sets: 6,
    setRestS: 180,
  },
  stravaActivityId: null,
  membershipId: null,
  week: null,
  focus: null,
  done: [],
  postState: null,
  postError: null,
  updatedAt: "2026-10-19T19:00:00.000Z",
};
jest.mock("@sendtally/features/settings", () => ({
  useGradeScalePrefs: () => ({ scales: mockScales, ready: true }),
  useDisplayScales: () => mockScales,
}));
jest.mock("@sendtally/features/gyms", () => ({ useGyms: () => ({ ready: false, gyms: [] }) }));
jest.mock("@sendtally/features/training", () => ({
  ...jest.requireActual<object>("@sendtally/features/training"),
  useTrainingLog: () => ({
    log: { plan: { blocks: [], memberships: [] }, workout: () => undefined },
  }),
}));
jest.mock("@sendtally/features/query", () => ({
  ...jest.requireActual<object>("@sendtally/features/query"),
  useQueryPair: () => ({
    state: {
      status: "ready",
      data: [
        {
          sessions: [mockNamed, mockBare],
          hangSessions: mockHangs,
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
  beforeEach(() => {
    mockScales = { boulder: "v", route: "yds" };
    mockUnit = "lb";
    mockHangs = [];
  });

  it("reads a hangboard row's load in lb for an lb climber, and leaves it off until the unit loads", async () => {
    mockHangs = [mockHang];
    await render(<SessionsLog />);
    expect(screen.getByLabelText(/Half crimp · 20.mm · \+8\.82.lb/)).toBeTruthy();
    mockUnit = null;
    await render(<SessionsLog />);
    expect(screen.getByLabelText(/Hangboard session · Half crimp, RPE 7/)).toBeTruthy();
  });

  it("reads every grade and weight in the user's settings, nothing in V or lb for a Font and kg climber", async () => {
    mockScales = { boulder: "font", route: "french" };
    mockUnit = "kg";
    mockHangs = [mockHang];
    await render(<SessionsLog />);
    expect(screen.getByLabelText(/Half crimp · 20.mm · \+4.kg/)).toBeTruthy();
    for (const wrong of [/\blb\b/, /\bV\d/]) {
      expect(screen.queryAllByText(wrong)).toHaveLength(0);
      expect(screen.queryAllByLabelText(wrong)).toHaveLength(0);
    }
  });

  it("lists climbing and training in one list, each row as before", async () => {
    await render(<SessionsLog />);
    expect(screen.getByLabelText(/^Tuesday night session, /)).toBeTruthy();
    expect(screen.getByLabelText("V4, Pocket Rocket, 1 try, Flash")).toBeTruthy();
    expect(screen.getByLabelText("V4, Brad Pit, Boulder, 3 tries")).toBeTruthy();
    expect(screen.getByText("Leg day")).toBeTruthy();
    expect(screen.queryByText("Logged session")).toBeNull();
    expect(screen.queryByText("Climbing")).toBeNull();
  });

  it("shows every grade in the scale picked in settings", async () => {
    mockScales = { boulder: "font", route: "yds" };
    await render(<SessionsLog />);
    expect(screen.getByLabelText("6B, Pocket Rocket, 1 try, Flash")).toBeTruthy();
    expect(screen.getByLabelText("6B, Brad Pit, Boulder, 3 tries")).toBeTruthy();
    expect(screen.getByLabelText(/^Tuesday night session, .* top 6C$/)).toBeTruthy();
    expect(screen.queryByText("V4")).toBeNull();
  });

  it("searches from the bar, keeping the dated list, and Cancel puts it back", async () => {
    await render(<SessionsLog />);
    await fireEvent.press(screen.getByLabelText("Search the Log"));
    await fireEvent.changeText(screen.getByLabelText("Search the Log"), "brad");
    expect(screen.getByLabelText("V4, Brad Pit, Boulder, 3 tries")).toBeTruthy();
    expect(screen.queryByLabelText(/^Tuesday night session, /)).toBeNull();
    expect(screen.queryByText("Leg day")).toBeNull();
    await fireEvent.press(screen.getByText("Cancel"));
    expect(screen.getByText("Leg day")).toBeTruthy();
  });

  it("says nothing matches, once", async () => {
    await render(<SessionsLog />);
    await fireEvent.press(screen.getByLabelText("Search the Log"));
    await fireEvent.changeText(screen.getByLabelText("Search the Log"), "nothing like it");
    expect(screen.getByText("Nothing matches.")).toBeTruthy();
  });

  it("narrows by type from the sheet, with a pill to drop it", async () => {
    await render(<SessionsLog />);
    await fireEvent.press(screen.getByLabelText("Filters"));
    await fireEvent.press(screen.getAllByText("Training")[0]!);
    await fireEvent.press(screen.getByText("Show 1 session"));
    expect(screen.getByText("Leg day")).toBeTruthy();
    expect(screen.queryByLabelText(/^Tuesday night session, /)).toBeNull();
    await fireEvent.press(screen.getByLabelText("Training, Clear"));
    expect(screen.getByLabelText(/^Tuesday night session, /)).toBeTruthy();
  });

  it("lists one row per climb once an outcome is set", async () => {
    await render(<SessionsLog />);
    await fireEvent.press(screen.getByLabelText("Filters"));
    await fireEvent.press(screen.getByText("Sent 1"));
    await fireEvent.press(screen.getByText("Show 1 climb"));
    expect(screen.getByText("Pocket Rocket")).toBeTruthy();
    expect(screen.queryByText("Brad Pit")).toBeNull();
    expect(screen.queryByLabelText(/^Tuesday night session, /)).toBeNull();
    expect(screen.getByLabelText("Climbing, Clear")).toBeTruthy();
  });

  it("lands from a Stats link with its workout as a pill", async () => {
    await render(<SessionsLog link="workout=title%3Aleg+day" />);
    expect(screen.getByLabelText("Leg day, Clear")).toBeTruthy();
    expect(screen.queryByLabelText(/^Tuesday night session, /)).toBeNull();
    expect(screen.queryByText("Clear all")).toBeNull();
  });

  it("opens a web Projects link as the Projects outcome", async () => {
    await render(<SessionsLog link="status=projects" />);
    expect(screen.getByLabelText("Projects, Clear")).toBeTruthy();
    expect(screen.queryByLabelText(/^Tuesday night session, /)).toBeNull();
  });

  it("holds every way to log, climbing and training, behind one Log button", async () => {
    await render(<SessionsLog />);
    await fireEvent.press(screen.getByTestId("fab"));
    expect(screen.getByText("Live session")).toBeTruthy();
    expect(screen.getByText("Log session")).toBeTruthy();
    expect(screen.getByText("Add climb")).toBeTruthy();
    expect(screen.getByText("Trip")).toBeTruthy();
    expect(screen.getByText("Journal")).toBeTruthy();
    expect(screen.getByText("Injury")).toBeTruthy();
    expect(screen.queryByText("Past session")).toBeNull();
  });
});
