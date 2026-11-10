import { describe, expect, it, jest } from "@jest/globals";
import React from "react";
import { Text } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ScreenFrame } from "./ScreenFrame";
import { Toast } from "./Toast";
import { TimeField } from "./TimeField";
import { useFieldOrder } from "./useFieldOrder";

jest.mock("expo-router", () => ({ router: { back: () => undefined } }));

async function press(...keys: string[]): Promise<void> {
  for (const key of keys) await fireEvent.press(screen.getByLabelText(key));
}

function Rests({
  onChange,
}: {
  onChange: (key: string, seconds: number) => void;
}): React.ReactElement {
  const { slot } = useFieldOrder(["hang", "rest"]);
  return (
    <ScreenFrame footer={<Text>Start</Text>}>
      <TimeField {...slot("hang")} label="Hang" value={7} onChange={(s) => onChange("hang", s)} />
      <TimeField {...slot("rest")} label="Rest" value={180} onChange={(s) => onChange("rest", s)} />
    </ScreenFrame>
  );
}

describe("ScreenFrame", () => {
  it("hides its pinned footer while the keypad is up", async () => {
    await render(<Rests onChange={() => undefined} />);
    expect(screen.getByText("Start")).toBeTruthy();
    await press("Hang");
    expect(screen.queryByText("Start")).toBeNull();
    expect(screen.getByTestId("keypad-room")).toBeTruthy();
    await press("Done");
    expect(screen.getByText("Start")).toBeTruthy();
    expect(screen.queryByTestId("keypad-room")).toBeNull();
  });

  it("lifts a toast above its footer, and leaves it at the foot without one", async () => {
    const toast = <Toast message="Added to Winter base" onHide={() => undefined} />;
    await render(<ScreenFrame overlay={toast} />);
    expect(screen.getByTestId("toast")).toHaveStyle({ bottom: 8 });
    await render(<ScreenFrame footer={<Text>Start</Text>} overlay={toast} />);
    await fireEvent(screen.getByTestId("screen-footer"), "layout", {
      nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 76 } },
    });
    expect(screen.getByTestId("toast")).toHaveStyle({ bottom: 88 });
  });

  it("walks its fields on one keypad that switches field in place on Next", async () => {
    const onChange = jest.fn();
    await render(<Rests onChange={onChange} />);
    await press("Hang", "1", "0", "Next");
    expect(onChange).toHaveBeenCalledWith("hang", 10);
    expect(screen.getAllByTestId("keypad-value")).toHaveLength(1);
    expect(screen.getByTestId("keypad-value")).toHaveTextContent("00:03:00");
    expect(screen.queryByText("Start")).toBeNull();
    await press("4", "5", "Done");
    expect(onChange).toHaveBeenCalledWith("rest", 45);
    expect(screen.getByText("Start")).toBeTruthy();
  });
});
