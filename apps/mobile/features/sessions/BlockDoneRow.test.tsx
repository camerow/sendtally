import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import type { Activity } from "@sendtally/api-client";
import type { BlockRecap } from "@sendtally/features/training";
import { ActivityRow } from "./ActivityRow";
import { BlockDoneRow } from "./BlockDoneRow";

const recap: BlockRecap = {
  block: { id: "b1", name: "Winter base", start: "2026-09-28", weeks: 4, focus: null },
  done: 12,
  planned: 15,
  missed: 3,
  soFar: { done: 12, planned: 15 },
  effort: 6.5,
  weeks: [1, 2, 3, 4].map((week) => ({ week, done: 3, planned: 4, effort: 6 })),
  workouts: [],
};

describe("BlockDoneRow", () => {
  it("names the finished block and what got done, and opens it", async () => {
    const onPress = jest.fn();
    await render(<BlockDoneRow recap={recap} onPress={onPress} />);
    expect(screen.getByText("Block finished")).toBeTruthy();
    expect(screen.getByText("Winter base")).toBeTruthy();
    expect(screen.getByText("4 weeks · 12 of 15 done")).toBeTruthy();
    await fireEvent.press(
      screen.getByLabelText("Block finished, Winter base, 4 weeks · 12 of 15 done")
    );
    expect(onPress).toHaveBeenCalled();
  });
});

describe("block tag on a logged session", () => {
  const activity: Activity = {
    id: "a1",
    kind: "strength",
    title: "Legs",
    date: "2026-10-19",
    startTime: null,
    minutes: 40,
    rpe: 7,
    notes: null,
    workoutId: "w1",
    membershipId: "m1",
    week: 4,
    focus: null,
    done: [],
  };

  it("adds a line naming the block and week, and nothing without one", async () => {
    await render(
      <ActivityRow activity={activity} blockTag="Winter base · W4" onPress={() => {}} />
    );
    expect(screen.getByText("Winter base · W4")).toBeTruthy();
    await render(<ActivityRow activity={activity} onPress={() => {}} />);
    expect(screen.queryByText("Winter base · W4")).toBeNull();
  });
});
