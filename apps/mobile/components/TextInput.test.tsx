import { describe, expect, it } from "@jest/globals";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { render, screen } from "@testing-library/react-native";
import React from "react";
import { TextInput } from "./TextInput";

const SHEET_INPUT = "bottom-sheet-text-input";

describe("TextInput", () => {
  it("is the plain input outside a sheet", async () => {
    await render(<TextInput accessibilityLabel="Name" />);
    expect(screen.getByLabelText("Name").props.testID).toBeUndefined();
  });

  it("is the sheet's own input inside a sheet", async () => {
    await render(
      <BottomSheetModal>
        <TextInput accessibilityLabel="Name" />
      </BottomSheetModal>
    );
    expect(screen.getByLabelText("Name").props.testID).toBe(SHEET_INPUT);
  });
});
