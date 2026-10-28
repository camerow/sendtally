import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { Alert, Linking } from "react-native";
import type {
  ActivityRecord,
  ConnectionStatus,
  HangSessionRecord,
  Plan,
  WorkoutRecord,
} from "@sendtally/api-client";
import { hangData, renderWithHang } from "../data/renderWithHang";
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
jest.mock("expo-router", () => ({ router: { push: jest.fn(), back: jest.fn() } }));

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
  updatedAt: "t",
};

const plan: Plan = {
  blocks: [{ id: "b1", name: "Strength block", start: "2026-10-13", weeks: 6 }],
  memberships: [{ id: "m1", workoutId: "legs", blockId: "b1", weekdays: [1], start: "2026-10-13" }],
  weekChanges: [],
};

const show = async (
  id: string,
  activities: ActivityRecord[],
  sessions: HangSessionRecord[] = []
): Promise<void> => {
  await renderWithHang(<WorkoutSummaryScreen id={id} />, hangData({ sessions }), {
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
  it("shows its kind, day and block week, its tiles, and each exercise against last time", async () => {
    await show("a1", [today, before]);
    expect(screen.getByText("Strength · Wed, Oct 28 · Week 3 of 6")).toBeTruthy();
    expect(screen.getByRole("header", { name: "Lower body strength" })).toBeTruthy();
    expect(screen.getByText("41 min")).toBeTruthy();
    expect(screen.getByText("effort · aimed 7")).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getByText("What you did")).toBeTruthy();
    expect(screen.getAllByText("+2.5 kg").length).toBeGreaterThan(0);
    expect(screen.getByText("Same")).toBeTruthy();
    expect(screen.getByText("+1 rep")).toBeTruthy();
    expect(screen.getByText("Last time 5 × 80 kg · Fri, Oct 23")).toBeTruthy();
    expect(screen.getByText("Over time")).toBeTruthy();
    expect(screen.getByText("+2.5 kg · best yet")).toBeTruthy();
  });

  it("lists the workout's past sessions with this one marked, each opening its summary", async () => {
    await show("a1", [today, before]);
    expect(screen.getByText("Past sessions")).toBeTruthy();
    expect(screen.getByText("Wed, Oct 28 · this session")).toBeTruthy();
    await fireEvent.press(screen.getByText("Back squat 5 × 80 kg · 41 min"));
    expect(router.push).toHaveBeenCalledWith({ pathname: "/activity/[id]", params: { id: "a0" } });
  });

  it("has no past sessions for a log with no workout, and still shows each exercise over time", async () => {
    const loose = { ...today, workoutId: null, membershipId: null, week: null };
    await show("a1", [loose, { ...before, workoutId: null }]);
    expect(screen.queryByText("Past sessions")).toBeNull();
    expect(screen.getByText("Over time")).toBeTruthy();
    expect(screen.getByText("effort")).toBeTruthy();
  });

  it("opens the form from Edit", async () => {
    await show("a1", [today]);
    await fireEvent.press(screen.getByText("Edit"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/activity/[id]/edit",
      params: { id: "a1" },
    });
  });

  it("shows a fingers session's hangs held and the weight against last time", async () => {
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
      done: [],
      stravaActivityId: null,
      postState: null,
      postError: null,
      updatedAt: "t",
    });
    await show("h2", [], [hang("h1", "2026-10-23", 10, 100), hang("h2", "2026-10-27", 12, 94)]);
    expect(screen.getByText("17/18")).toBeTruthy();
    expect(screen.getByText("hangs held")).toBeTruthy();
    expect(screen.getByText("+2 kg vs last")).toBeTruthy();
    expect(screen.getByText("+12 kg · 3 sets of 6 · 1 hang let go")).toBeTruthy();
    expect(screen.getByText("Added weight on this grip")).toBeTruthy();
    expect(screen.getByText("+10 kg · 18 of 18 hangs")).toBeTruthy();
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
    expect(
      await screen.findByText("As a workout, with RPE 7 and your sets in the description")
    ).toBeTruthy();
    await fireEvent.press(screen.getByText("Post to Strava"));
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
    expect(screen.getByText("Removes it here; the Strava activity stays")).toBeTruthy();
    await fireEvent.press(screen.getByText("View on Strava"));
    expect(open).toHaveBeenCalledWith("https://www.strava.com/activities/9");
  });

  it("offers another go after a failed post, with Strava's reason", async () => {
    await show("a1", [{ ...today, postState: "failed", postError: "rate limited" }]);
    expect(await screen.findByText("Strava post failed")).toBeTruthy();
    await pressMenu();
    expect(screen.getAllByText("rate limited")).toHaveLength(2);
    await fireEvent.press(screen.getByText("Try posting again"));
    expect(mockApi.postActivityToStrava).toHaveBeenCalledWith("a1");
  });

  it("deletes only once confirmed, by name and with no more said", async () => {
    const alert = jest.spyOn(Alert, "alert");
    mockApi.deleteActivity.mockResolvedValue({ deleted: true });
    await show("a1", [today]);
    await pressMenu();
    expect(screen.getByText("Removes it from your log and trends")).toBeTruthy();
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
