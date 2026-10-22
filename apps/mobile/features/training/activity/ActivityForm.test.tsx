import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import { Alert } from "react-native";
import React from "react";
import type { ActivityRecord } from "@sendtally/api-client";
import type * as Activities from "@sendtally/features/activities";
import {
  activityFromDraft,
  newActivityDraft,
  type ActivityPostFeature,
} from "@sendtally/features/activities";
import { ActivityForm } from "./ActivityForm";

const mockActions = { saveActivity: jest.fn(), deleteActivity: jest.fn() };
const mockPost = { busy: false, error: null, run: jest.fn() };
const mockWorkouts = { saveWorkout: jest.fn(), deleteWorkout: jest.fn() };

jest.mock("../../../components/Sheet", () => ({ Sheet: () => null }));
jest.mock("expo-router", () => ({ router: { back: jest.fn(), push: jest.fn() } }));
jest.mock("expo-crypto", () => ({ randomUUID: () => "w-new" }));
jest.mock("@sendtally/features/workouts", () => ({ useWorkoutActions: () => mockWorkouts }));
jest.mock("../../../lib/api", () => ({ useApi: () => undefined }));
jest.mock("@sendtally/features/activities", () => {
  const actual = jest.requireActual<typeof Activities>("@sendtally/features/activities");
  return {
    ...actual,
    useActivityActions: () => mockActions,
    useWeightUnit: () => "kg",
    useActivityPost: (_api: unknown, activity: ActivityRecord): ActivityPostFeature => ({
      vm: actual.activityPostVM(activity, { connected: true, active: true, since: null }),
      action: mockPost,
    }),
  };
});

const logged = (post: Partial<ActivityRecord> = {}): ActivityRecord => ({
  ...activityFromDraft("a1", newActivityDraft({}, "2026-10-22")),
  stravaActivityId: null,
  postedAt: null,
  postState: null,
  postError: null,
  ...post,
});

describe("Log activity", () => {
  it("saves an untitled activity under its kind's name with its effort and load", async () => {
    await render(
      <ActivityForm id="a1" initial={newActivityDraft({}, "2026-10-22")} logged={null} />
    );
    await fireEvent.press(screen.getByText("Mobility"));
    await fireEvent.press(screen.getByLabelText("5 minutes less"));
    await fireEvent.press(screen.getByLabelText("Effort 7 of 10"));
    expect(screen.getByText("55 min × 7 = 385")).toBeTruthy();
    await fireEvent.press(screen.getByText("Save"));

    expect(mockActions.saveActivity).toHaveBeenCalledWith({
      id: "a1",
      kind: "mobility",
      title: "Mobility",
      date: "2026-10-22",
      startTime: null,
      minutes: 55,
      rpe: 7,
      notes: null,
      workoutId: null,
      membershipId: null,
      week: null,
      variation: null,
      done: [],
    });
    expect(router.back).toHaveBeenCalled();
  });

  it("logs what a planned workout prescribes, and saves it with the plan it ran", async () => {
    const initial = newActivityDraft(
      { kind: "strength", membershipId: "m1", week: "2", variation: "1", workoutId: "w1" },
      "2026-10-22",
      [{ exercise: "Back squat", dose: { sets: 2, reps: 5, weightKg: 100 } }]
    );
    await render(<ActivityForm id="a1" initial={initial} logged={null} />);
    expect(screen.getByText("5 × 100 kg  /  5 × 100 kg")).toBeTruthy();
    await fireEvent.press(screen.getByText("Save"));
    expect(mockActions.saveActivity).toHaveBeenLastCalledWith(
      expect.objectContaining({
        workoutId: "w1",
        membershipId: "m1",
        week: 2,
        variation: 1,
        done: [
          {
            item: 0,
            exercise: "Back squat",
            sets: [
              { reps: 5, weightKg: 100 },
              { reps: 5, weightKg: 100 },
            ],
          },
        ],
      })
    );
  });

  it("saves what a logged session did as a library workout of its kind", async () => {
    const initial = {
      ...newActivityDraft({ kind: "mobility", title: "Hip flow" }, "2026-10-22"),
      rpe: 3,
      done: [{ item: 0, exercise: "Pigeon", sets: [{ onS: 60 }] }],
    };
    await render(<ActivityForm id="a1" initial={initial} logged={logged()} />);
    await fireEvent.press(screen.getByText("Save as workout"));
    expect(mockWorkouts.saveWorkout).toHaveBeenCalledWith("w-new", {
      kind: "mobility",
      name: "Hip flow",
      description: "",
      minutes: 60,
      targetRpe: 3,
      variations: [{ label: "", items: [{ exercise: "Pigeon", dose: { sets: 1, onS: 60 } }] }],
      pattern: [0],
    });
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/workout/[id]",
      params: { id: "w-new" },
    });
  });

  it("offers no Save as workout with nothing done", async () => {
    await render(
      <ActivityForm id="a1" initial={newActivityDraft({}, "2026-10-22")} logged={logged()} />
    );
    expect(screen.queryByText("Save as workout")).toBeNull();
  });

  it("deletes an existing activity only once confirmed", async () => {
    const alert = jest.spyOn(Alert, "alert");
    await render(
      <ActivityForm id="a1" initial={newActivityDraft({}, "2026-10-22")} logged={logged()} />
    );
    await fireEvent.press(screen.getByText("Delete activity"));
    expect(alert.mock.calls[0]?.[1]).toBe(
      "It comes out of your log and your statistics. This can’t be undone."
    );
    expect(mockActions.deleteActivity).not.toHaveBeenCalled();
    const buttons = alert.mock.calls[0]?.[2] ?? [];
    buttons.find((b) => b.style === "destructive")?.onPress?.();
    expect(mockActions.deleteActivity).toHaveBeenCalledWith("a1");
  });

  it("posts a logged activity to Strava on request", async () => {
    await render(
      <ActivityForm id="a1" initial={newActivityDraft({}, "2026-10-22")} logged={logged()} />
    );
    expect(screen.getByText("Not posted to Strava")).toBeTruthy();
    await fireEvent.press(screen.getByText("Post to Strava"));
    expect(mockPost.run).toHaveBeenCalled();
  });

  it("offers a retry after a failed post and keeps the Strava activity on delete", async () => {
    const alert = jest.spyOn(Alert, "alert");
    await render(
      <ActivityForm
        id="a1"
        initial={newActivityDraft({}, "2026-10-22")}
        logged={logged({ postState: "failed", postError: "strava rate limit hit, not posted yet" })}
      />
    );
    expect(screen.getByText("strava rate limit hit, not posted yet")).toBeTruthy();
    expect(screen.getByText("Retry")).toBeTruthy();
    alert.mockClear();
    await render(
      <ActivityForm
        id="a1"
        initial={newActivityDraft({}, "2026-10-22")}
        logged={logged({ stravaActivityId: "9", postedAt: "2026-10-22T10:00:00Z" })}
      />
    );
    expect(screen.queryByText("Post to Strava")).toBeNull();
    await fireEvent.press(screen.getByText("Delete activity"));
    expect(alert.mock.calls[0]?.[1]).toContain("so the Strava activity stays");
  });
});
