import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Keyboard, Platform, Text, type KeyboardEvent } from "react-native";
import { KeyboardAvoider } from "./KeyboardAvoider";

const SHOWN = { android: "keyboardDidShow", ios: "keyboardWillShow" } as const;

describe("KeyboardAvoider", () => {
  it.each(["android", "ios"] as const)("lifts its content above the keys on %s", async (os) => {
    const platform = jest.replaceProperty(Platform, "OS", os);
    const listeners = new Map<string, (e: KeyboardEvent) => void>();
    const addListener = jest.spyOn(Keyboard, "addListener").mockImplementation((name, fn) => {
      listeners.set(name, fn as (e: KeyboardEvent) => void);
      return { remove: () => undefined } as ReturnType<typeof Keyboard.addListener>;
    });

    await render(
      <KeyboardAvoider>
        <Text>Field</Text>
      </KeyboardAvoider>
    );
    const frame = screen.getByText("Field").parent;
    if (frame === null) throw new Error("no frame");
    await act(async () => {
      fireEvent(frame, "layout", {
        persist: () => undefined,
        nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 800 } },
      });
    });
    await act(async () => {
      listeners.get(SHOWN[os])?.({
        endCoordinates: { screenX: 0, screenY: 500, width: 400, height: 300 },
      } as KeyboardEvent);
    });

    expect(frame).toHaveStyle({ paddingBottom: 300 });
    addListener.mockRestore();
    platform.restore();
  });
});
