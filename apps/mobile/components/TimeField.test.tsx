import { describe, expect, it, jest } from "@jest/globals";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
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
    expect(screen.getByText("00:01:00")).toBeTruthy();
    await press("Done");
    expect(onChange).toHaveBeenCalledWith(60);
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
