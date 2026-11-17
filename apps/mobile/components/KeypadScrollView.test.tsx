import { describe, expect, it, jest } from "@jest/globals";
import { Pressable, Text } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { KeypadScrollView } from "./KeypadScrollView";
import { TimeField } from "./TimeField";

describe("KeypadScrollView", () => {
  it("closes the keypad on a touch outside it, keeps what was typed, and the touch still lands", async () => {
    const onChange = jest.fn();
    const onTick = jest.fn();
    const onKeypadChange = jest.fn();
    await render(
      <KeypadScrollView testID="form" onKeypadChange={onKeypadChange}>
        <TimeField label="Rest" value={180} onChange={onChange} />
        <Pressable onPress={onTick} accessibilityRole="button">
          <Text>Tick</Text>
        </Pressable>
      </KeypadScrollView>
    );
    await fireEvent.press(screen.getByLabelText("Rest"));
    await fireEvent.press(screen.getByLabelText("1"));
    expect(onKeypadChange).toHaveBeenLastCalledWith(true);

    await fireEvent(screen.getByTestId("form"), "touchStart", {});
    await fireEvent.press(screen.getByText("Tick"));

    expect(onKeypadChange).toHaveBeenLastCalledWith(false);
    expect(onChange).toHaveBeenCalledWith(1);
    expect(onTick).toHaveBeenCalled();
  });

  it("keeps the keypad up for a touch on a field", async () => {
    const onKeypadChange = jest.fn();
    await render(
      <KeypadScrollView onKeypadChange={onKeypadChange}>
        <TimeField label="Rest" value={180} onChange={() => {}} />
      </KeypadScrollView>
    );
    await fireEvent.press(screen.getByLabelText("Rest"));
    await fireEvent(screen.getByLabelText("Rest"), "touchStart", { stopPropagation: () => {} });
    expect(onKeypadChange).toHaveBeenLastCalledWith(true);
  });
});
