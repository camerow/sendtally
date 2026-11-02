import { describe, expect, it, jest } from "@jest/globals";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import {
  Dimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
  type View,
} from "react-native";
import { keypadHeight } from "./Keypad";
import { useKeepAboveKeypad } from "./useKeepAboveKeypad";

const windowHeight = Dimensions.get("window").height;
const keypadTop = windowHeight - keypadHeight(0);

const fieldAt = (y: number, height = 46): View =>
  ({
    measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) =>
      callback(0, y, 100, height),
  }) as unknown as View;

const scrolledTo = (y: number): NativeSyntheticEvent<NativeScrollEvent> =>
  ({ nativeEvent: { contentOffset: { x: 0, y } } }) as NativeSyntheticEvent<NativeScrollEvent>;

async function keep(): Promise<{
  result: { current: ReturnType<typeof useKeepAboveKeypad> };
  scrollTo: jest.Mock;
}> {
  const { result } = await renderHook(() => useKeepAboveKeypad());
  const scrollTo = jest.fn();
  result.current.scrollRef.current = { scrollTo } as unknown as ScrollView;
  return { result, scrollTo };
}

describe("useKeepAboveKeypad", () => {
  it("scrolls a field the keypad would cover to just above it, from where the view is scrolled", async () => {
    const { result, scrollTo } = await keep();
    await act(() => result.current.onScroll(scrolledTo(200)));
    await act(() => result.current.reveal(fieldAt(keypadTop + 10)));
    await waitFor(() =>
      expect(scrollTo).toHaveBeenCalledWith({ y: 200 + 10 + 46 + 12, animated: true })
    );
  });

  it("leaves a field already above the keypad where it is", async () => {
    const { result, scrollTo } = await keep();
    const measured = jest.fn();
    const field = fieldAt(keypadTop - 200);
    await act(() =>
      result.current.reveal({
        measureInWindow: (cb: Parameters<View["measureInWindow"]>[0]) => {
          measured();
          field.measureInWindow(cb);
        },
      } as unknown as View)
    );
    await waitFor(() => expect(measured).toHaveBeenCalled());
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("leaves room under the content as tall as the keypad", async () => {
    const { result } = await keep();
    expect(result.current.room).toBe(keypadHeight(0));
  });
});
