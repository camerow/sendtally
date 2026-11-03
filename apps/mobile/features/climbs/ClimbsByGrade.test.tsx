import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import type { GradeClimbsVM } from "@sendtally/features/climbs";
import { ClimbsByGrade } from "./ClimbsByGrade";

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));

const climb = (id: string, name: string, opens = true): GradeClimbsVM["climbs"][number] => ({
  key: id,
  opens,
  row: { id, gradeLabel: "V6", name, meta: "Oct 12", pill: { kind: "sent", label: "Sent" } },
});

const grades: GradeClimbsVM[] = [
  { key: "7", gradeLabel: "V7", split: "1 attempted", climbs: [climb("c1", "Roof")] },
  {
    key: "6",
    gradeLabel: "V6",
    split: "1 sent · 1 attempted",
    climbs: [climb("c2", "Arete"), climb("x", "Unnamed", false)],
  },
];

describe("Climbs by grade", () => {
  it("counts every climb and opens one grade at a time", async () => {
    await render(<ClimbsByGrade grades={grades} />);
    expect(screen.getByText("3 climbs")).toBeTruthy();
    expect(screen.queryByText("Arete")).toBeNull();

    await fireEvent.press(screen.getByLabelText("V6, 1 sent · 1 attempted"));
    expect(screen.getByText("Arete")).toBeTruthy();

    await fireEvent.press(screen.getByLabelText("V7, 1 attempted"));
    expect(screen.getByText("Roof")).toBeTruthy();
    expect(screen.queryByText("Arete")).toBeNull();

    await fireEvent.press(screen.getByLabelText("V7, 1 attempted"));
    expect(screen.queryByText("Roof")).toBeNull();
  });

  it("opens a named climb and leaves an unnamed one still", async () => {
    await render(<ClimbsByGrade grades={grades} />);
    await fireEvent.press(screen.getByLabelText("V6, 1 sent · 1 attempted"));
    await fireEvent.press(screen.getByText("Unnamed"));
    expect(router.push).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByText("Arete"));
    expect(router.push).toHaveBeenCalledWith({ pathname: "/climb/[id]", params: { id: "c2" } });
  });
});
