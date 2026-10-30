import { describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";
import { State } from "react-native-gesture-handler";
import { fireGestureHandler, getByGestureTestId } from "react-native-gesture-handler/jest-utils";
import { SegmentSwipe } from "./SegmentSwipe";

const OPTIONS = [{ value: "a" }, { value: "b" }, { value: "c" }] as const;

const swipe = async (value: "a" | "b" | "c", translationX: number): Promise<jest.Mock> => {
  const onChange = jest.fn();
  await render(
    <SegmentSwipe options={OPTIONS} value={value} onChange={onChange}>
      <Text>Log</Text>
    </SegmentSwipe>
  );
  fireGestureHandler(getByGestureTestId("segment-swipe"), [
    { state: State.BEGAN, translationX: 0, velocityX: 0 },
    { state: State.ACTIVE, translationX: translationX / 2, velocityX: 0 },
    { state: State.END, translationX, velocityX: 0 },
  ]);
  return onChange;
};

describe("SegmentSwipe", () => {
  it("moves to the next segment on a swipe left and the one before on a swipe right", async () => {
    expect(await swipe("b", -90)).toHaveBeenCalledWith("c");
    expect(await swipe("b", 90)).toHaveBeenCalledWith("a");
  });

  it("stays put past either end, and leaves a short drag alone", async () => {
    expect(await swipe("c", -90)).not.toHaveBeenCalled();
    expect(await swipe("a", 90)).not.toHaveBeenCalled();
    expect(await swipe("b", -40)).not.toHaveBeenCalled();
  });
});
