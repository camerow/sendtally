import { describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
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

  it("mounts the page in view and its neighbours only", async () => {
    await pager("b");
    const shown = (v: Page): boolean =>
      screen.queryByText(`page ${v}`, { includeHiddenElements: true }) !== null;
    expect(OPTIONS.map((o) => shown(o.value))).toEqual([true, true, true, false]);
  });
});
