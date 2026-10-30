import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import type { SetDone } from "@sendtally/core/hang";
import { SetDoneFields } from "./SetDoneFields";

jest.mock("../../../components/Sheet", () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? children : null,
}));

function Logged({ onChange }: { onChange: (set: SetDone) => void }): React.ReactElement {
  const [set, setSet] = React.useState<SetDone>({ reps: 8, weightKg: 10 });
  return (
    <SetDoneFields
      set={set}
      lifting
      unit="kg"
      label="Pull-up, set 1"
      onChange={(next) => {
        setSet(next);
        onChange(next);
      }}
    />
  );
}

async function press(...keys: string[]): Promise<void> {
  for (const key of keys) await fireEvent.press(screen.getByLabelText(key));
}

describe("SetDoneFields", () => {
  it("walks reps into weight with Next, and logs an assisted set as a negative weight", async () => {
    const onChange = jest.fn();
    await render(<Logged onChange={onChange} />);
    await press("Pull-up, set 1 · Reps", "6", "Next");
    expect(screen.getByLabelText("Pull-up, set 1 · Weight").props.accessibilityState).toEqual({
      expanded: true,
    });
    await press("1", "5", "Change sign", "Done");
    expect(onChange).toHaveBeenLastCalledWith({ reps: 6, weightKg: -15 });
    expect(screen.getByLabelText("Pull-up, set 1 · Weight").props.accessibilityValue).toEqual({
      text: "−15 kg",
    });
  });
});
