import { describe, expect, it } from "@jest/globals";
import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react-native";
import type { ClimbSummary } from "@sendtally/api-client";
import { newClimb, type ClimbDraft, type GradeScale } from "@sendtally/features/log-session";
import { ResultFields } from "./ResultFields";

function climbAt(scale: GradeScale, overrides: Partial<ClimbDraft> = {}): ClimbDraft {
  return { ...newClimb("c1", scale), name: "Maestro Arete", ...overrides };
}

function Harness({
  initial,
  known = null,
}: {
  initial: ClimbDraft;
  known?: ClimbSummary | null;
}): React.ReactElement {
  const [climb, setClimb] = React.useState(initial);
  return <ResultFields climb={climb} known={known} onChange={setClimb} />;
}

type Step = { press: string } | { pick: "Onsight" | "Flash" } | { toggle: true };

const cases: {
  name: string;
  climb: ClimbDraft;
  steps: Step[];
  result: string;
  tries: number;
  styleRow: boolean;
}[] = [
  {
    name: "a new boulder is an attempt with no style row",
    climb: climbAt("v"),
    steps: [],
    result: "Attempt",
    tries: 1,
    styleRow: false,
  },
  {
    name: "toggling a one-try boulder on flashes it",
    climb: climbAt("v"),
    steps: [{ toggle: true }],
    result: "Flash",
    tries: 1,
    styleRow: false,
  },
  {
    name: "more tries on a sent boulder collapses to sent",
    climb: climbAt("v"),
    steps: [{ toggle: true }, { press: "+" }],
    result: "Sent",
    tries: 2,
    styleRow: false,
  },
  {
    name: "a one-try route send defaults to onsight and shows the style row",
    climb: climbAt("yds"),
    steps: [{ toggle: true }],
    result: "Onsight",
    tries: 1,
    styleRow: true,
  },
  {
    name: "a picked flash survives a trip through redpoint and back",
    climb: climbAt("yds"),
    steps: [{ toggle: true }, { pick: "Flash" }, { press: "+" }, { press: "−" }],
    result: "Flash",
    tries: 1,
    styleRow: true,
  },
  {
    name: "tries above one on a route is a redpoint without the style row",
    climb: climbAt("yds"),
    steps: [{ toggle: true }, { press: "+" }, { press: "+" }],
    result: "Redpoint",
    tries: 3,
    styleRow: false,
  },
  {
    name: "toggling off keeps the tries",
    climb: climbAt("yds", { kind: "send", style: "redpoint", tries: 4 }),
    steps: [{ toggle: true }],
    result: "Attempt",
    tries: 4,
    styleRow: false,
  },
];

describe("ResultFields", () => {
  it.each(cases)("$name", async ({ climb, steps, result, tries, styleRow }) => {
    await render(<Harness initial={climb} />);
    for (const step of steps) {
      await fireEvent.press(
        "press" in step
          ? screen.getByText(step.press)
          : "pick" in step
            ? screen.getByRole("radio", { name: step.pick })
            : screen.getByRole("switch", { name: "Sent" })
      );
    }
    const row = screen.getByRole("switch", { name: "Sent", checked: result !== "Attempt" });
    expect(within(row).getAllByText(result)[0]).toBeOnTheScreen();
    expect(screen.getByText(String(tries))).toBeOnTheScreen();
    expect(screen.queryByRole("radio", { name: "Onsight" }) !== null).toBe(styleRow);
  });

  it.each([
    { name: "no history, attempt", known: null, sent: false, line: "No sends yet" },
    { name: "no history, sent", known: null, sent: true, line: "1 send" },
    { name: "two prior sends, sent now", known: { sends: 2 }, sent: true, line: "3 sends" },
  ])("counts sends: $name", async ({ known, sent, line }) => {
    await render(
      <Harness
        initial={climbAt("v", sent ? { kind: "send", style: "flash" } : {})}
        known={known as ClimbSummary | null}
      />
    );
    expect(screen.getByText(line)).toBeOnTheScreen();
  });
});
