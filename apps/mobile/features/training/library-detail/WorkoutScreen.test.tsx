import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import type { ActivityRecord, Plan, WorkoutRecord } from "@sendtally/api-client";
import { builtInWorkouts } from "@sendtally/features/workouts";
import { aHang, hangData, renderWithHang } from "../data/renderWithHang";
import { LibraryCard } from "../library/LibraryCard";
import { WorkoutScreen } from "./WorkoutScreen";

jest.mock("expo-router", () => ({ router: { push: jest.fn(), back: jest.fn() } }));
jest.mock("../../../lib/api", () => ({ useApi: () => undefined }));
jest.mock("../../../components/Sheet", () => ({ Sheet: () => null }));
jest.mock("expo-crypto", () => ({ randomUUID: () => "copy" }));

const logged = aHang({ id: "h1", workoutId: "fingers-ab", rpe: 7 });

const legs: WorkoutRecord = {
  id: "legs",
  kind: "strength",
  name: "Gym, legs",
  description: "",
  minutes: 50,
  targetRpe: null,
  items: [{ exercise: "Back squat", doses: [{ sets: 5, reps: 5 }] }],
  exerciseRestS: 180,
  focus: null,
  updatedAt: "t",
};

const ran = (id: string, date: string, rpe: number | null): ActivityRecord => ({
  id,
  kind: "strength",
  title: "Gym, legs",
  date,
  startTime: null,
  minutes: 45,
  rpe,
  notes: null,
  workoutId: "legs",
  membershipId: null,
  week: null,
  focus: null,
  done: [{ item: 0, exercise: "Back squat", sets: [{ reps: 5, weightKg: 80 }] }],
  stravaActivityId: null,
  postedAt: null,
  postState: null,
  postError: null,
});

const planned: Plan = {
  blocks: [],
  memberships: [
    { id: "m1", workoutId: "legs", blockId: null, weekdays: [0], start: "2026-09-28", position: 0 },
  ],
  weekChanges: [],
  planChanges: [],
  membershipDays: [],
};

const labels = (): string[] =>
  screen
    .getAllByText(/^(Exercises|Over time|History · .*|Planned in)$/)
    .map((n) => String(n.props.children));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Hangboard workout", () => {
  it("shows the first dose before any session", async () => {
    await renderWithHang(<WorkoutScreen id="fingers-ab" />);
    expect(screen.getByText("6 × 1")).toBeTruthy();
  });

  it("shows the dose the next session takes, as Start runs it", async () => {
    await renderWithHang(<WorkoutScreen id="fingers-ab" />, hangData({ sessions: [logged] }));
    expect(screen.getByText("3 × 6")).toBeTruthy();
    expect(screen.queryByText("6 × 1")).toBeNull();
  });

  it("links to its grip's progress once the grip has a session", async () => {
    await renderWithHang(<WorkoutScreen id="fingers-ab" />);
    expect(screen.queryByText("Half crimp progress")).toBeNull();
    await renderWithHang(<WorkoutScreen id="fingers-ab" />, hangData({ sessions: [logged] }));
    await fireEvent.press(screen.getByText("Half crimp progress"));
    expect(router.push).toHaveBeenCalledWith({ pathname: "/grip/[id]", params: { id: "half" } });
  });

  it("lists its grip as an exercise, with what it last used once it has", async () => {
    await renderWithHang(<WorkoutScreen id="fingers-ab" />);
    expect(screen.getByText("Half crimp")).toBeTruthy();
    expect(screen.queryByText("Grip")).toBeNull();
    expect(screen.queryByText(/^Last used/)).toBeNull();
    await renderWithHang(<WorkoutScreen id="fingers-ab" />, hangData({ sessions: [logged] }));
    expect(screen.getByText(/^Last used .+/)).toBeTruthy();
  });

  it("never run, holds only its exercises", async () => {
    await renderWithHang(<WorkoutScreen id="fingers-ab" />);
    expect(labels()).toEqual(["Exercises"]);
  });

  it("lists its sessions after its exercises and over time, each opening its summary", async () => {
    await renderWithHang(<WorkoutScreen id="fingers-ab" />, hangData({ sessions: [logged] }));
    expect(labels()).toEqual(["Exercises", "Over time", "History · 1 session"]);
    expect(screen.getByText("RPE 7")).toBeTruthy();
    await fireEvent.press(screen.getByText("Bodyweight · 6 of 6 hangs"));
    expect(router.push).toHaveBeenCalledWith({ pathname: "/activity/[id]", params: { id: "h1" } });
  });

  it("opened while adding, adds it instead of starting or changing it", async () => {
    await renderWithHang(
      <WorkoutScreen id="fingers-ab" adding={{ date: "2026-10-01", blockId: "b1" }} />
    );
    expect(screen.queryByText("Start")).toBeNull();
    expect(screen.queryByText("Customize")).toBeNull();
    expect(screen.queryByLabelText("More")).toBeNull();
    expect(screen.getByText("Add")).toBeTruthy();
  });
});

describe("Other workouts", () => {
  it("shows a block plan's days for the week the block is on", async () => {
    await renderWithHang(<WorkoutScreen id="legs" />, hangData(), {
      workouts: [legs],
      plan: {
        ...planned,
        blocks: [{ id: "b1", name: "Base", start: "2026-09-21", weeks: 4, focus: null }],
        memberships: [
          {
            id: "m1",
            workoutId: "legs",
            blockId: "b1",
            weekdays: [],
            start: "2026-09-21",
            position: 0,
          },
        ],
        membershipDays: [{ membershipId: "m1", fromWeek: 2, weekdays: [1] }],
      },
    });
    expect(screen.getByLabelText("Tue")).toBeTruthy();
  });

  it("reads Exercises, Over time, History, then Planned in", async () => {
    await renderWithHang(<WorkoutScreen id="legs" />, hangData(), {
      workouts: [legs],
      activities: [ran("a1", "2026-09-20", 6), ran("a2", "2026-09-27", 8)],
      plan: planned,
    });
    expect(labels()).toEqual(["Exercises", "Over time", "History · 2 sessions", "Planned in"]);
    expect(screen.getByText("RPE 8")).toBeTruthy();
    await fireEvent.press(screen.getAllByText("Back squat 5 × 80 kg · 45 min")[0]!);
    expect(router.push).toHaveBeenCalledWith({ pathname: "/activity/[id]", params: { id: "a2" } });
  });

  it("starts or plans it from its footer", async () => {
    await renderWithHang(<WorkoutScreen id="legs" />, hangData(), { workouts: [legs] });
    expect(screen.getByText("Start")).toBeTruthy();
    await fireEvent.press(screen.getByText("Add to plan"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/plan/schedule",
      params: { workoutId: "legs" },
    });
  });

  it("opened from a missed run, names its day and logs it on that day", async () => {
    await renderWithHang(
      <WorkoutScreen id="legs" run={{ date: "2026-09-28", membershipId: "m1" }} />,
      hangData(),
      { workouts: [legs], plan: planned }
    );
    expect(screen.getByText("Missed Mon, Sep 28")).toBeTruthy();
    expect(screen.getByText("Reschedule")).toBeTruthy();
    expect(screen.queryByText("Add to plan")).toBeNull();
    expect(screen.queryByText("Edit")).toBeNull();
    await fireEvent.press(screen.getByText("Log it"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/activity/new",
      params: expect.objectContaining({ date: "2026-09-28", membershipId: "m1" }),
    });
  });

  it("logs it without the timer on its review, every set as planned", async () => {
    await renderWithHang(<WorkoutScreen id="legs" />, hangData(), { workouts: [legs] });
    await fireEvent.press(screen.getByText("Log it"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/activity/new",
      params: expect.objectContaining({ kind: "strength", workoutId: "legs", session: "0" }),
    });
    expect(router.push).toHaveBeenCalledWith(
      expect.not.objectContaining({ params: expect.objectContaining({ done: expect.anything() }) })
    );
  });
});

describe("Its length", () => {
  it("reads the planned length from its dose, the same on its card and its screen", async () => {
    const maxHangs = builtInWorkouts().find((w) => w.id === "max10")!;
    await renderWithHang(<LibraryCard workout={maxHangs} use={undefined} onPress={() => {}} />);
    expect(screen.getByText("13m")).toBeTruthy();

    await renderWithHang(<WorkoutScreen id="max10" />);
    expect(screen.getByText("13m · Not used yet")).toBeTruthy();
    expect(screen.getByText("13m")).toBeTruthy();
  });
});

describe("A climbing workout", () => {
  const boulders: WorkoutRecord = {
    ...legs,
    id: "boulders",
    kind: "climbing",
    name: "Hard boulders",
    minutes: 60,
    items: [{ exercise: "Limit boulders", doses: [{ sets: 4, reps: 4 }] }],
    focus: "power",
  };

  it("names only its kind and focus in its kicker, even for the user's own", async () => {
    await renderWithHang(<WorkoutScreen id="boulders" />, hangData(), { workouts: [boulders] });
    expect(screen.getByText("Climbing · Power")).toBeTruthy();
    expect(screen.queryByText(/Mine/)).toBeNull();
  });

  it("reads an exercise the library does not know in climbs, as the player does", async () => {
    await renderWithHang(<WorkoutScreen id="boulders" />, hangData(), { workouts: [boulders] });
    expect(screen.getByText("4 sets of 4 climbs")).toBeTruthy();
    expect(screen.queryByText("4 × 4")).toBeNull();
  });
});
