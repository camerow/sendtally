import { describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";
import { State } from "react-native-gesture-handler";
import { fireGestureHandler, getByGestureTestId } from "react-native-gesture-handler/jest-utils";
import { TabSwipe } from "./TabSwipe";

const swipe = async (translationX: number): Promise<jest.Mock> => {
  const onSwipe = jest.fn();
  await render(
    <TabSwipe onSwipe={onSwipe}>
      <Text>Log</Text>
    </TabSwipe>
  );
  fireGestureHandler(getByGestureTestId("tab-swipe"), [
    { state: State.BEGAN, translationX: 0, velocityX: 0 },
    { state: State.ACTIVE, translationX: translationX / 2, velocityX: 0 },
    { state: State.END, translationX, velocityX: 0 },
  ]);
  return onSwipe;
};

describe("TabSwipe", () => {
  it("moves to the next tab on a swipe left and the one before on a swipe right", async () => {
    expect(await swipe(-90)).toHaveBeenCalledWith(1);
    expect(await swipe(90)).toHaveBeenCalledWith(-1);
  });

  it("leaves a short drag alone", async () => {
    expect(await swipe(-40)).not.toHaveBeenCalled();
  });
});
