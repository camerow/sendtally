import { describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import React from "react";
import { StyleSheet, View } from "react-native";
import { TimeField } from "../../../components/TimeField";
import { NumberField } from "./NumberField";
import { SheetSection } from "./SheetSection";
import { Stepper } from "./Stepper";

const styleOf = (text: string): object => StyleSheet.flatten(screen.getByText(text).props.style);

describe("number field labels", () => {
  it("label every typable number above its box, in a form section's voice", async () => {
    await render(
      <View>
        <SheetSection label="Section">
          <View />
        </SheetSection>
        <TimeField label="Rest" value={60} onChange={jest.fn()} />
        <NumberField label="Reps" value={5} step={1} onChange={jest.fn()} />
        <Stepper
          label="Weeks"
          value={4}
          step={1}
          onChange={jest.fn()}
          onStep={jest.fn()}
          decreaseLabel="Fewer"
          increaseLabel="More"
          surface="plain"
        />
      </View>
    );
    const section = styleOf("Section");
    for (const label of ["Rest", "Reps", "Weeks"]) expect(styleOf(label)).toEqual(section);
  });

  it("gives a compact stepper's buttons a 44pt touch target", async () => {
    await render(
      <Stepper
        compact
        label="Attempts"
        value={1}
        step={1}
        onChange={jest.fn()}
        onStep={jest.fn()}
        decreaseLabel="Fewer"
        increaseLabel="More"
        surface="plain"
      />
    );
    for (const label of ["Fewer", "More"]) {
      const button = screen.getByLabelText(label);
      expect(StyleSheet.flatten(button.props.style)).toMatchObject({ width: 36, height: 36 });
      expect(button.props.hitSlop).toBe(4);
    }
  });
});
