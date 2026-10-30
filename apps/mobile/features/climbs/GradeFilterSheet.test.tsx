import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import type { ClimbSummary } from "@sendtally/api-client";
import { gradeFilterLabel, type GradeFilter } from "@sendtally/features/climbs";
import { GradeFilterSheet } from "./GradeFilterSheet";

jest.mock("../../components/Sheet", () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? children : null,
}));

const climb = (id: string, value: number): ClimbSummary =>
  ({ id, grade: { scale: "v", value }, discipline: "boulder" }) as ClimbSummary;

const CLIMBS = [climb("a", 4), climb("b", 4), climb("c", 5), climb("d", 6), climb("e", 6)];

function Harness({ seen }: { seen: Array<GradeFilter | null> }): React.ReactElement {
  const [value, setValue] = React.useState<GradeFilter | null>(null);
  return (
    <GradeFilterSheet
      visible
      value={value}
      scales={{ boulder: "v", route: "yds" }}
      climbs={CLIMBS}
      onChange={(next) => {
        seen.push(next);
        setValue(next);
      }}
      onClose={() => {}}
    />
  );
}

describe("Grade filter sheet", () => {
  it("picks one grade with a tap and closes a range with a second", async () => {
    const seen: Array<GradeFilter | null> = [];
    await render(<Harness seen={seen} />);
    expect(screen.getAllByText("2")).toHaveLength(2);
    expect(
      screen.getByText("Tap a grade for just that grade, then another to make a range.")
    ).toBeTruthy();

    await fireEvent.press(screen.getByLabelText("V6, 2 climbs"));
    expect(seen.at(-1)).toEqual({ scale: "v", from: "V6", to: "V6" });
    expect(screen.getByText(/keep just V6/)).toBeTruthy();

    await fireEvent.press(screen.getByLabelText("V4, 2 climbs"));
    const range = seen.at(-1) ?? null;
    expect(range).toEqual({ scale: "v", from: "V4", to: "V6" });
    expect(range === null ? null : gradeFilterLabel(range)).toBe("V4 to V6");
    expect(screen.getByLabelText("V5, 1 climb").props.accessibilityState).toMatchObject({
      selected: true,
    });
  });

  it("offers any grade, limit and volume presets below the bars", async () => {
    const seen: Array<GradeFilter | null> = [];
    await render(<Harness seen={seen} />);
    await fireEvent.press(screen.getByText("Limit · V4+"));
    expect(seen.at(-1)).toEqual({ scale: "v", from: "V4", to: "V6" });
    await fireEvent.press(screen.getByText("Any grade"));
    expect(seen.at(-1)).toBeNull();
  });
});
