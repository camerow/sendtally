import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { Alert, Linking } from "react-native";
import type {
  ActivityRecord,
  ConnectionStatus,
  HangPart,
  HangSessionRecord,
  Plan,
  WorkoutRecord,
} from "@sendtally/api-client";
import { aHang, hangData, renderWithHang } from "../data/renderWithHang";
import { WorkoutSummaryScreen } from "./WorkoutSummaryScreen";

type Strava = { status: "active" | "dead" } | null;

const mockApi = {
  postActivityToStrava: jest.fn<(id: string) => Promise<unknown>>(),
  postHangSession: jest.fn<(id: string) => Promise<unknown>>(),
  deleteActivity: jest.fn<(id: string) => Promise<unknown>>(),
  sessions: () => new Promise(() => undefined),
};
const mockConnect = jest.fn();

jest.mock("../../../lib/api", () => ({ useApi: () => mockApi }));
jest.mock("../../settings/useStravaConnect", () => ({
  useStravaConnect: () => ({ connect: mockConnect, busy: false, error: null }),
}));
jest.mock("../../../components/Sheet", () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? children : null,
}));
jest.mock("expo-router", () => ({
  router: { canGoBack: () => true, push: jest.fn(), back: jest.fn() },
}));

let strava: Strava = { status: "active" };

const status = (): ConnectionStatus =>
  ({
    strava:
      strava === null
        ? null
        : { athleteId: 1, postingEnabled: false, postSince: null, postTraining: false, ...strava },
  }) as unknown as ConnectionStatus;

const activity = (
  id: string,
  date: string,
  over: Partial<ActivityRecord> = {}
): ActivityRecord => ({
  id,
  kind: "strength",
  title: "Lower body strength",
  date,
  startTime: null,
  minutes: 41,
  rpe: 7,
  notes: null,
  workoutId: "legs",
  membershipId: null,
  week: null,
  focus: null,
  done: [],
  stravaActivityId: null,
  postedAt: null,
  postState: null,
  postError: null,
  ...over,
});

const squat = (kg: number, reps = 5) => ({ reps, weightKg: kg });

const before = activity("a0", "2026-10-23", {
  rpe: 8,
  done: [
    { item: 0, exercise: "Back squat", sets: [squat(80), squat(80)] },
    { item: 1, exercise: "Bench press", sets: [{ reps: 8, weightKg: 60 }] },
    { item: 2, exercise: "Weighted pull-up", sets: [{ reps: 6, weightKg: 10 }] },
  ],
});

const today = activity("a1", "2026-10-28", {
  focus: "power",
  membershipId: "m1",
  week: 3,
  done: [
    { item: 0, exercise: "Back squat", sets: [squat(82.5), squat(82.5), squat(82.5, 4)] },
    { item: 1, exercise: "Bench press", sets: [{ reps: 8, weightKg: 60 }] },
    { item: 2, exercise: "Weighted pull-up", sets: [{ reps: 7, weightKg: 10 }] },
  ],
});

const legs: WorkoutRecord = {
  id: "legs",
  kind: "strength",
  name: "Lower body strength",
  description: "",
  minutes: 45,
  targetRpe: 7,
  items: [],
  exerciseRestS: 0,
  focus: null,
  updatedAt: "t",
};

const plan: Plan = {
  blocks: [
    {
      id: "b1",
      name: "Strength block",
      description: "",
      start: "2026-10-13",
      weeks: 6,
      focus: null,
    },
  ],
  memberships: [
    { id: "m1", workoutId: "legs", blockId: "b1", weekdays: [1], start: "2026-10-13", position: 0 },
  ],
  weekChanges: [],
  planChanges: [],
  membershipDays: [],
};

const show = async (
  id: string,
  activities: ActivityRecord[],
  sessions: HangSessionRecord[] = [],
  parts: HangPart[] = []
): Promise<void> => {
  await renderWithHang(<WorkoutSummaryScreen id={id} />, hangData({ sessions, parts }), {
    activities,
    workouts: [legs],
    plan,
    status: status(),
  });
};

const pressMenu = async (): Promise<void> => {
  await fireEvent.press(screen.getByLabelText("More"));
};

beforeEach(() => {
  jest.clearAllMocks();
  strava = { status: "active" };
});

describe("A finished workout's summary", () => {
  it("shows its kind over the title, length and RPE tiles, and each set as done", async () => {
    await show("a1", [today, before]);
    expect(screen.getByText("Strength")).toBeTruthy();
    expect(screen.getByRole("header", { name: "Lower body strength" })).toBeTruthy();
    expect(screen.getByText("41 min")).toBeTruthy();
    expect(screen.getByText("RPE 7")).toBeTruthy();
    expect(screen.getByText("Target RPE 7/10")).toBeTruthy();
    expect(screen.getAllByText("5 reps × 82.5 kg")).toHaveLength(2);
    expect(screen.getByText("4 reps × 82.5 kg")).toBeTruthy();
    expect(screen.getByText("7 reps × 10 kg")).toBeTruthy();
    expect(screen.queryByText(/sets|What you did|Last time|Over time|\+2.5 kg/)).toBeNull();
  });

  it("draws its checklist with the lines ticked in the run", async () => {
    const checklist = { lines: ["Chalk, tape, brush", "Log the warm-up climbs"], checked: [0] };
    await show("a1", [
      { ...today, done: [{ item: 0, exercise: "Checklist", sets: [], checklist }] },
    ]);
    expect(screen.getByText("Checklist")).toBeTruthy();
    expect(
      screen.getByRole("checkbox", { name: "Chalk, tape, brush" }).props.accessibilityState
    ).toMatchObject({ checked: true });
    expect(
      screen.getByRole("checkbox", { name: "Log the warm-up climbs" }).props.accessibilityState
    ).toMatchObject({ checked: false });
  });

  it("shows its notes under the tiles", async () => {
    await show("a1", [{ ...today, notes: "Felt slow to warm up." }]);
    expect(screen.getByText("Felt slow to warm up.")).toBeTruthy();
  });

  it("keeps a rated set's RPE in its own column, beside its values", async () => {
    const rated = {
      ...today,
      done: [{ item: 0, exercise: "Back squat", sets: [{ ...squat(80), rpe: 8 }, squat(80)] }],
    };
    await show("a1", [rated]);
    expect(screen.getAllByText("5 reps × 80 kg")).toHaveLength(2);
    expect(screen.getByText("RPE 8")).toBeTruthy();
  });

  it("shows its workout's fingerboard part grip by grip before the other exercises", async () => {
    const sets = [
      { reps: 1, onS: 10, rpe: 8 },
      { reps: 1, onS: 10 },
    ];
    const part = {
      ...aHang({
        date: "2026-10-28",
        workoutId: "legs",
        done: [{ item: 0, exercise: "half", sets }],
      }),
      activityId: "a1",
    };
    await show("a1", [today, before], [], [part]);
    const names = screen
      .getAllByText(/^(Half crimp.*|Back squat)$/)
      .map((n) => n.props.children as string);
    expect(names[0]).toMatch(/^Half crimp/);
    expect(names.slice(1)).toContain("Back squat");
  });

  it("opens the workout's history from History, this session marked, with none inline", async () => {
    await show("a1", [today, before]);
    expect(screen.queryByText(/^History · /)).toBeNull();
    await fireEvent.press(screen.getByText("History"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/workout/history",
      params: { id: "legs", current: "a1" },
    });
  });

  it("has no History for a log with no workout, and names its RPE without a target", async () => {
    const loose = { ...today, workoutId: null, membershipId: null, week: null };
    await show("a1", [loose, { ...before, workoutId: null }]);
    expect(screen.queryByText("History")).toBeNull();
    expect(screen.getByText("Hard")).toBeTruthy();
  });

  it("reads a climbing workout's exercises without grading them against last time", async () => {
    const v = (grade: string, sent = true) => ({ grade, scale: "v" as const, tries: 1, sent });
    const climbing = (id: string, date: string, sends: boolean[]) =>
      activity(id, date, {
        kind: "climbing",
        title: "Power endurance",
        done: [
          { item: 0, exercise: "4x4s", sets: [{ climbs: sends.map((sent) => v("V4", sent)) }] },
        ],
      });
    await show("c2", [
      climbing("c2", "2026-10-28", [true, true, true, false]),
      climbing("c1", "2026-10-21", [true, false, false, false]),
    ]);
    expect(screen.getByText("Climbing")).toBeTruthy();
    expect(screen.getByText("4x4s")).toBeTruthy();
    expect(screen.queryByText(/vs last/)).toBeNull();
  });

  it("opens the form from Edit", async () => {
    await show("a1", [today]);
    await fireEvent.press(screen.getByText("Edit"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/activity/[id]/edit",
      params: { id: "a1" },
    });
  });

  it("shows a fingers session's hangs held and each set's load", async () => {
    const protocol = {
      name: "Repeaters 7/3",
      kind: "hang" as const,
      hangS: 7,
      restS: 3,
      reps: 6,
      sets: 3,
      setRestS: 180,
    };
    const hang = (id: string, date: string, loadKg: number, pct: number): HangSessionRecord => ({
      id,
      workoutId: "repeaters",
      gripId: "half-crimp",
      date,
      edgeMm: 20,
      loadKg,
      pct,
      misses: 0,
      rpe: 8,
      protocol,
      membershipId: null,
      week: null,
      focus: null,
      done: [],
      stravaActivityId: null,
      postState: null,
      postError: null,
      updatedAt: "t",
    });
    await show("h2", [], [hang("h1", "2026-10-23", 10, 100), hang("h2", "2026-10-27", 12, 94)]);
    expect(screen.queryByText("hangs held")).toBeNull();
    expect(screen.getAllByText("+12 kg")).toHaveLength(3);
    expect(screen.getByText("17 of 18 hangs")).toBeTruthy();
    expect(screen.queryByText("Added weight on this exercise")).toBeNull();
    expect(screen.queryByText("+10 kg · 18 of 18 hangs")).toBeNull();
    expect(screen.queryByText("New best")).toBeNull();
  });

  it("celebrates a completed hang that beats the grip's best on its setup", async () => {
    await show(
      "h2",
      [],
      [aHang({ id: "h1", loadKg: 10 }), aHang({ id: "h2", date: "2026-10-27", loadKg: 12 })]
    );
    expect(screen.getByText("New best")).toBeTruthy();
    expect(screen.getByText("Half crimp +12 kg")).toBeTruthy();
    expect(screen.getByText("20\u00A0mm · 10s · up 2 kg on your last best")).toBeTruthy();
  });
});

describe("The ··· menu", () => {
  it("asks to connect Strava first when it is not connected", async () => {
    strava = null;
    await show("a1", [today]);
    await pressMenu();
    await fireEvent.press(await screen.findByText("Connect Strava"));
    expect(mockConnect).toHaveBeenCalled();
  });

  it("posts on request, spinning while it runs", async () => {
    let resolve: (v: unknown) => void = () => undefined;
    mockApi.postActivityToStrava.mockReturnValue(new Promise((r) => (resolve = r)));
    await show("a1", [today]);
    await pressMenu();
    await fireEvent.press(await screen.findByText("Post to Strava"));
    expect(mockApi.postActivityToStrava).toHaveBeenCalledWith("a1");
    expect(screen.getAllByText("Posting to Strava…").length).toBe(2);
    await act(async () => resolve({ activity: { ...today, stravaActivityId: "9" } }));
    expect(screen.getByText("View on Strava")).toBeTruthy();
  });

  it("views a posted workout on Strava, and says the activity stays there on delete", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await show("a1", [{ ...today, stravaActivityId: "9", postedAt: "2026-10-28T20:42:00Z" }]);
    expect(screen.getByText("On Strava")).toBeTruthy();
    await pressMenu();
    await fireEvent.press(screen.getByText("View on Strava"));
    expect(open).toHaveBeenCalledWith("https://www.strava.com/activities/9");
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    await pressMenu();
    await fireEvent.press(screen.getByText("Delete workout"));
    expect(alert.mock.calls[0]?.[1]).toBe("Removes it here; the Strava activity stays");
    alert.mockRestore();
  });

  it("offers another go after a failed post, with Strava's reason", async () => {
    mockApi.postActivityToStrava.mockResolvedValue({
      activity: { ...today, stravaActivityId: "9" },
    });
    await show("a1", [{ ...today, postState: "failed", postError: "rate limited" }]);
    expect(await screen.findByText("Strava post failed")).toBeTruthy();
    await pressMenu();
    expect(screen.getAllByText("rate limited")).toHaveLength(2);
    await fireEvent.press(screen.getByText("Try posting again"));
    expect(mockApi.postActivityToStrava).toHaveBeenCalledWith("a1");
    expect(await screen.findByText("On Strava")).toBeTruthy();
  });

  it("deletes only once confirmed, by name and with no more said", async () => {
    const alert = jest.spyOn(Alert, "alert");
    mockApi.deleteActivity.mockResolvedValue({ deleted: true });
    await show("a1", [today]);
    await pressMenu();
    await fireEvent.press(screen.getByText("Delete workout"));
    expect(alert.mock.calls[0]?.[0]).toBe("Delete Lower body strength?");
    expect(alert.mock.calls[0]?.[1]).toBeUndefined();
    expect(mockApi.deleteActivity).not.toHaveBeenCalled();
    const buttons = alert.mock.calls[0]?.[2] ?? [];
    await act(async () => buttons.find((b) => b.style === "destructive")?.onPress?.());
    await waitFor(() => expect(mockApi.deleteActivity).toHaveBeenCalledWith("a1"));
    expect(router.back).toHaveBeenCalled();
    alert.mockRestore();
  });
});
