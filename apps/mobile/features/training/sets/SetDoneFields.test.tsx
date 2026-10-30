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

  it.each<[string, SetDone, string[], string[]]>([
    ["reps × weight", { reps: 5, weightKg: 60 }, ["Reps", "Weight"], ["×"]],
    ["weight · time", { weightKg: 10, onS: 45 }, ["Weight", "Hold"], ["·"]],
    ["reps", { reps: 12 }, ["Reps"], []],
    ["time", { onS: 45 }, ["Hold"], []],
  ])(
    "lays %s on one line, joined as its target reads, with no labels shown",
    async (_, set, names, joiners) => {
      await render(<SetDoneFields set={set} unit="kg" label="Set 2" onChange={() => undefined} />);
      expect(screen.getAllByRole("button").map((b) => b.props.accessibilityLabel)).toEqual(
        names.map((n) => `Set 2 · ${n}`)
      );
      for (const name of names) expect(screen.queryByText(name)).toBeNull();
      for (const mark of ["×", "·"])
        expect(screen.queryAllByText(mark, { includeHiddenElements: true })).toHaveLength(
          joiners.includes(mark) ? 1 : 0
        );
    }
  );
});
