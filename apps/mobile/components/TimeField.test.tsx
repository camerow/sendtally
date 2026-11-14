import { describe, expect, it, jest } from "@jest/globals";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { KeypadField } from "./KeypadField";
import { KeypadScrollView } from "./KeypadScrollView";
import { TimeField } from "./TimeField";

async function press(...keys: string[]): Promise<void> {
  for (const key of keys) await fireEvent.press(screen.getByLabelText(key));
}

describe("TimeField", () => {
  it("reads HH:MM:SS and types a new length on the keypad", async () => {
    const onChange = jest.fn();
    await render(<TimeField label="Rest" value={1200} onChange={onChange} />);
    expect(screen.getByLabelText("Rest").props.accessibilityValue).toEqual({ text: "00:20:00" });
    await press("Rest", "1", "0", "0");
    expect(screen.getAllByText("00:01:00")).toHaveLength(2);
    await press("Done");
    expect(onChange).toHaveBeenCalledWith(60);
  });

  it.each([
    ["on its own", false],
    ["on a screen's keypad", true],
  ])("shows HH:MM:SS in the field after every key %s, before Done", async (_, hosted) => {
    const onChange = jest.fn();
    const field = <TimeField label="Rest" value={180} onChange={onChange} />;
    await render(hosted ? <KeypadScrollView>{field}</KeypadScrollView> : field);
    const shown = (): unknown => screen.getByLabelText("Rest").props.accessibilityValue.text;
    await press("Rest");
    expect(shown()).toBe("00:03:00");
    const steps: [string, string][] = [
      ["1", "00:00:01"],
      ["0", "00:00:10"],
      ["0", "00:01:00"],
      ["Delete last digit", "00:00:10"],
      ["9", "00:01:09"],
    ];
    for (const [key, text] of steps) {
      await press(key);
      expect(shown()).toBe(text);
    }
    expect(onChange).not.toHaveBeenCalled();
    await press("Done");
    expect(onChange).toHaveBeenCalledWith(69);
  });

  it("goes back to its value when Reset closes the keypad", async () => {
    const onChange = jest.fn();
    await render(
      <KeypadField
        label="Rest"
        mode={{ kind: "time" }}
        value={180}
        text={["00:0", "3:00"]}
        onChange={onChange}
        onReset={() => {}}
      />
    );
    await press("Rest", "5");
    expect(screen.getByLabelText("Rest").props.accessibilityValue.text).toBe("00:00:05");
    await fireEvent.press(screen.getByText("Reset"));
    expect(screen.getByLabelText("Rest").props.accessibilityValue.text).toBe("00:03:00");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("clamps to its limits", async () => {
    const onChange = jest.fn();
    await render(<TimeField label="Rest" value={10} max={60} onChange={onChange} />);
    await press("Rest", "5", "0", "0", "Done");
    expect(onChange).toHaveBeenCalledWith(60);
  });

  it("commits and calls through on Next", async () => {
    const onChange = jest.fn();
    const onNext = jest.fn();
    await render(<TimeField label="Rest" value={10} onChange={onChange} onNext={onNext} />);
    await press("Rest", "3", "Next");
    expect(onChange).toHaveBeenCalledWith(3);
    expect(onNext).toHaveBeenCalled();
  });
});
