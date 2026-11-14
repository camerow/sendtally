import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import type { GradeClimbsVM } from "@sendtally/features/climbs";
import { ClimbsByGrade } from "./ClimbsByGrade";

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));

const climb = (id: string, name: string): GradeClimbsVM["climbs"][number] => ({
  key: id,
  target: { kind: "climb", id },
  row: { id, gradeLabel: "V6", name, meta: "Oct 12", pill: { kind: "sent", label: "Sent" } },
});

const gym: GradeClimbsVM["climbs"][number] = {
  key: "s1:6",
  target: { kind: "session", id: "s1" },
  row: {
    id: "s1",
    gradeLabel: "V6",
    name: "Gym climbs",
    count: 3,
    meta: "Oct 30",
    pill: { kind: "tries", label: "4 tries" },
  },
};

const grades: GradeClimbsVM[] = [
  { key: "7", gradeLabel: "V7", split: "1 attempted", climbs: [climb("c1", "Roof")] },
  {
    key: "6",
    gradeLabel: "V6",
    split: "1 sent · 3 attempted",
    climbs: [climb("c2", "Arete"), gym],
  },
];

describe("Climbs by grade", () => {
  it("counts every climb and opens one grade at a time", async () => {
    await render(<ClimbsByGrade grades={grades} total={5} />);
    expect(screen.getByText("5 climbs")).toBeTruthy();
    expect(screen.queryByText("Arete")).toBeNull();

    await fireEvent.press(screen.getByLabelText("V6, 1 sent · 3 attempted"));
    expect(screen.getByText("Arete")).toBeTruthy();

    await fireEvent.press(screen.getByLabelText("V7, 1 attempted"));
    expect(screen.getByText("Roof")).toBeTruthy();
    expect(screen.queryByText("Arete")).toBeNull();

    await fireEvent.press(screen.getByLabelText("V7, 1 attempted"));
    expect(screen.queryByText("Roof")).toBeNull();
  });

  it("opens a named climb on its screen and a session's gym climbs on the session", async () => {
    await render(<ClimbsByGrade grades={grades} total={5} />);
    await fireEvent.press(screen.getByLabelText("V6, 1 sent · 3 attempted"));
    expect(screen.getAllByText("V6")).toHaveLength(1);
    await fireEvent.press(screen.getByLabelText("V6, Gym climbs ×3, Oct 30, 4 tries"));
    expect(router.push).toHaveBeenLastCalledWith({
      pathname: "/session/[fingerprint]",
      params: { fingerprint: "s1" },
    });
    await fireEvent.press(screen.getByText("Arete"));
    expect(router.push).toHaveBeenLastCalledWith({
      pathname: "/climb/[id]",
      params: { id: "c2" },
    });
  });
});
