import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { DarkWeek } from "./DarkWeek";

const week = [null, [], null, null, null, null, null] as const;

describe("DarkWeek", () => {
  it("is a picture with no onToggle", async () => {
    await render(<DarkWeek week={week} />);
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });

  it("makes each day the control that toggles it, named in full and checked when on", async () => {
    const onToggle = jest.fn();
    await render(<DarkWeek week={week} onToggle={onToggle} />);
    expect(screen.getAllByRole("checkbox")).toHaveLength(7);
    expect(screen.getByLabelText("Tuesday").props.accessibilityState).toEqual({ checked: true });
    expect(screen.getByLabelText("Monday").props.accessibilityState).toEqual({ checked: false });
    await fireEvent.press(screen.getByLabelText("Thursday"));
    expect(onToggle).toHaveBeenCalledWith(3);
  });
});
