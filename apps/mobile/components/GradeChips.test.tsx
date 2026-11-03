import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { ScrollView } from "react-native";
import { GradeChips, type GradeChip } from "./GradeChips";

const vs: GradeChip[] = Array.from({ length: 12 }, (_, i) => ({ key: `v${i}`, label: `V${i}` }));
const fonts: GradeChip[] = vs.map((c) => ({ key: `f${c.key}`, label: c.label }));

function Picker({ chips }: { chips: GradeChip[] }): React.ReactElement {
  const [active, setActive] = React.useState<string | null>(null);
  const at = chips.findIndex((c) => c.key === active);
  return (
    <GradeChips
      chips={chips}
      active={active}
      startIndex={at < 0 ? 4 : at}
      light
      onPick={setActive}
    />
  );
}

describe("GradeChips", () => {
  it("opens at the user's range and stays put when a grade is picked", async () => {
    const scrollTo = jest.spyOn(ScrollView.prototype, "scrollTo");
    const view = await render(<Picker chips={vs} />);
    expect(scrollTo).toHaveBeenLastCalledWith({ x: 3 * 64, animated: false });
    scrollTo.mockClear();
    await fireEvent.press(screen.getByLabelText("V10"));
    expect(scrollTo).not.toHaveBeenCalled();
    await view.rerender(<Picker chips={fonts} />);
    expect(scrollTo).toHaveBeenCalledTimes(1);
    scrollTo.mockRestore();
  });
});
