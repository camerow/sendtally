import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { setLocale } from "@sendtally/features/i18n";
import { NumberField } from "./NumberField";

afterEach(() => setLocale("en"));

describe("NumberField", () => {
  it("commits nothing when focused and left without typing", async () => {
    const onCommit = jest.fn();
    await render(<NumberField value="1,200" onCommit={onCommit} label="Work" deferred />);
    await fireEvent(screen.getByLabelText("Work"), "focus");
    await fireEvent(screen.getByLabelText("Work"), "blur");
    expect(onCommit).not.toHaveBeenCalled();
  });

  it.each<["en" | "de", string]>([
    ["en", "1,200"],
    ["de", "1.200"],
  ])("edits %s %j without its thousands separator", async (locale, value) => {
    setLocale(locale);
    const onCommit = jest.fn();
    await render(<NumberField value={value} onCommit={onCommit} label="Work" deferred />);
    const field = screen.getByLabelText("Work");
    await fireEvent(field, "focus");
    expect(screen.getByLabelText("Work").props.value).toBe("1200");
    await fireEvent.changeText(field, "12000");
    await fireEvent(field, "submitEditing");
    expect(onCommit).toHaveBeenCalledWith("12000");
  });
});
