import { describe, expect, it, jest } from "@jest/globals";
import { act, render, screen } from "@testing-library/react-native";
import React from "react";
import { Text } from "react-native";
import { State } from "react-native-gesture-handler";
import { fireGestureHandler, getByGestureTestId } from "react-native-gesture-handler/jest-utils";
import { useSharedValue } from "react-native-reanimated";
import { SegmentPager } from "./SegmentPager";

type Page = "a" | "b" | "c" | "d";
const OPTIONS = [{ value: "a" }, { value: "b" }, { value: "c" }, { value: "d" }] as const;

function Pager({
  value,
  onChange,
}: {
  value: Page;
  onChange: (v: Page) => void;
}): React.ReactElement {
  const progress = useSharedValue(0);
  return (
    <SegmentPager
      options={OPTIONS}
      value={value}
      onChange={onChange}
      progress={progress}
      renderPage={(v) => <Text>{`page ${v}`}</Text>}
    />
  );
}

const pager = async (value: Page): Promise<jest.Mock> => {
  const onChange = jest.fn();
  await render(<Pager value={value} onChange={onChange} />);
  return onChange;
};

const swipe = async (value: Page, translationX: number): Promise<jest.Mock> => {
  const onChange = await pager(value);
  fireGestureHandler(getByGestureTestId("segment-swipe"), [
    { state: State.BEGAN, translationX: 0, velocityX: 0 },
    { state: State.ACTIVE, translationX: translationX / 2, velocityX: 0 },
    { state: State.END, translationX, velocityX: 0 },
  ]);
  return onChange;
};

describe("SegmentPager", () => {
  it("moves to the next segment on a swipe left and the one before on a swipe right", async () => {
    expect(await swipe("b", -90)).toHaveBeenCalledWith("c");
    expect(await swipe("b", 90)).toHaveBeenCalledWith("a");
  });

  it("stays put past either end, and leaves a short drag alone", async () => {
    expect(await swipe("d", -90)).not.toHaveBeenCalled();
    expect(await swipe("a", 90)).not.toHaveBeenCalled();
    expect(await swipe("b", -40)).not.toHaveBeenCalled();
  });

  it("mounts the page in view first and its neighbours a frame later, never further", async () => {
    const frames: FrameRequestCallback[] = [];
    jest.spyOn(global, "requestAnimationFrame").mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
    await pager("b");
    const shown = (): boolean[] =>
      OPTIONS.map(
        (o) => screen.queryByText(`page ${o.value}`, { includeHiddenElements: true }) !== null
      );
    expect(shown()).toEqual([false, true, false, false]);
    await act(async () => frames.forEach((frame) => frame(0)));
    expect(shown()).toEqual([true, true, true, false]);
  });
});
