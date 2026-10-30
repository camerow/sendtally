import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { NumberField } from "./NumberField";

async function press(...keys: string[]): Promise<void> {
  for (const key of keys) await fireEvent.press(screen.getByLabelText(key));
}

describe("NumberField", () => {
  it("reads its value with the unit inside and types a new one on the keypad", async () => {
    const onChange = jest.fn();
    await render(
      <NumberField label="Weight" value={1200} unit="kg" step={2.5} decimals onChange={onChange} />
    );
    expect(screen.getByLabelText("Weight").props.accessibilityValue).toEqual({ text: "1,200 kg" });
    await press("Weight", "4", "Decimal point", "5", "Add 2.5", "Done");
    expect(onChange).toHaveBeenCalledWith(7);
  });

  it("reads unset as its placeholder and commits nothing when closed untouched", async () => {
    const onChange = jest.fn();
    await render(
      <NumberField label="Climbs" value={null} placeholder="Any" step={1} onChange={onChange} />
    );
    expect(screen.getByLabelText("Climbs").props.accessibilityValue).toEqual({ text: "Any" });
    await press("Climbs", "Done");
    expect(onChange).not.toHaveBeenCalled();
  });
});
