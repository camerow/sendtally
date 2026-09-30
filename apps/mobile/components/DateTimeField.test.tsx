import { describe, expect, it, jest } from "@jest/globals";
import React from "react";
import { Platform } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { DateTimeField } from "./DateTimeField";

type PickerEvent = { type: "set" | "dismissed" };
type PickerProps = { onChange: (event: PickerEvent, date?: Date) => void; value: Date };

const pickers: PickerProps[] = [];

jest.mock("@react-native-community/datetimepicker", () => {
  const Picker = (props: PickerProps): null => {
    pickers.push(props);
    return null;
  };
  return {
    __esModule: true,
    default: Picker,
    DateTimePickerAndroid: { open: (props: PickerProps) => pickers.push(props) },
  };
});

jest.mock(
  "react-native-safe-area-context",
  () => jest.requireActual<{ default: unknown }>("react-native-safe-area-context/jest/mock").default
);

const lastPicker = (): PickerProps => pickers[pickers.length - 1]!;

async function renderTime(onChange: (v: string) => void): Promise<void> {
  await render(
    <DateTimeField mode="time" value="" label="Start" placeholder="-" onChange={onChange} />
  );
}

describe("DateTimeField", () => {
  it("leaves an empty time empty when the iOS picker only opens", async () => {
    const onChange = jest.fn();
    await renderTime(onChange);
    await fireEvent.press(screen.getByLabelText("Start"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("takes the shown time once Done is tapped on iOS", async () => {
    const onChange = jest.fn();
    await renderTime(onChange);
    await fireEvent.press(screen.getByLabelText("Start"));
    await fireEvent.press(screen.getByText("Done"));
    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^\d{2}:\d{2}$/));
  });

  it("ignores a dismissed Android dialog and keeps a set one", async () => {
    const os = jest.replaceProperty(Platform, "OS", "android");
    const onChange = jest.fn();
    await renderTime(onChange);
    await fireEvent.press(screen.getByLabelText("Start"));
    lastPicker().onChange({ type: "dismissed" }, lastPicker().value);
    expect(onChange).not.toHaveBeenCalled();

    lastPicker().onChange({ type: "set" }, new Date(1970, 0, 1, 18, 30));
    expect(onChange).toHaveBeenCalledWith("18:30");
    os.restore();
  });
});
