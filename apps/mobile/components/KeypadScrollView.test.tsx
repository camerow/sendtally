import { describe, expect, it, jest } from "@jest/globals";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { KeypadScrollView } from "./KeypadScrollView";
import { useOutsideTapRoot } from "./outsideTap";
import { TimeField } from "./TimeField";

function Root({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <View testID="root" {...useOutsideTapRoot()}>
      {children}
    </View>
  );
}

const at = (y: number, fingers = 1) => ({
  nativeEvent: { pageX: 100, pageY: y, touches: Array.from({ length: fingers }, () => ({})) },
});

describe("KeypadScrollView", () => {
  it("closes the keypad on a tap anywhere outside it, header included, and the tap still lands; a drag or two fingers leave it up", async () => {
    const onChange = jest.fn();
    const onSave = jest.fn();
    const onKeypadChange = jest.fn();
    await render(
      <Root>
        <Pressable onPress={onSave} accessibilityRole="button">
          <Text>Save</Text>
        </Pressable>
        <KeypadScrollView onKeypadChange={onKeypadChange}>
          <TimeField label="Rest" value={180} onChange={onChange} />
        </KeypadScrollView>
      </Root>
    );
    await fireEvent.press(screen.getByLabelText("Rest"));
    await fireEvent.press(screen.getByLabelText("1"));
    expect(onKeypadChange).toHaveBeenLastCalledWith(true);

    await fireEvent(screen.getByTestId("root"), "touchStart", at(300));
    await fireEvent(screen.getByTestId("root"), "touchEnd", at(260));
    expect(onKeypadChange).toHaveBeenLastCalledWith(true);

    await fireEvent(screen.getByTestId("root"), "touchStart", at(300, 2));
    await fireEvent(screen.getByTestId("root"), "touchEnd", at(300));
    expect(onKeypadChange).toHaveBeenLastCalledWith(true);

    await fireEvent(screen.getByTestId("root"), "touchStart", at(40));
    await fireEvent(screen.getByTestId("root"), "touchEnd", at(43));
    await fireEvent.press(screen.getByText("Save"));

    expect(onKeypadChange).toHaveBeenLastCalledWith(false);
    expect(onChange).toHaveBeenCalledWith(1);
    expect(onSave).toHaveBeenCalled();
  });

  it("closes a field when one in another row opens, so the first can open again", async () => {
    await render(
      <KeypadScrollView>
        <TimeField label="Rest A" value={60} onChange={() => {}} />
        <TimeField label="Rest B" value={90} onChange={() => {}} />
      </KeypadScrollView>
    );
    const expanded = (name: string): boolean | undefined =>
      screen.getByLabelText(name).props.accessibilityState?.expanded;
    await fireEvent.press(screen.getByLabelText("Rest A"));
    await fireEvent.press(screen.getByLabelText("Rest B"));
    expect(expanded("Rest A")).toBe(false);
    expect(expanded("Rest B")).toBe(true);
    await fireEvent.press(screen.getByLabelText("Rest A"));
    expect(expanded("Rest A")).toBe(true);
    expect(expanded("Rest B")).toBe(false);
  });
});
