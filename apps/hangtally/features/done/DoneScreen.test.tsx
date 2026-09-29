import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { renderWithHang, TODAY } from "../data/renderWithHang";
import { DoneScreen } from "./DoneScreen";

jest.mock("expo-router", () => ({ router: { navigate: jest.fn() } }));
jest.mock("expo-crypto", () => ({ randomUUID: () => "session-1" }));

const partial = {
  workoutId: "rep73",
  gripId: "half",
  loadKg: 4,
  result: { ended: true, setsDone: 2, pct: 30, work: 76, misses: 2, seconds: 312 },
};

describe("Session done", () => {
  it("explains a partial and logs it with effort and a protocol snapshot", async () => {
    const { actions } = await renderWithHang(<DoneScreen params={partial} />);
    expect(screen.getByText("Ended early · Half crimp")).toBeTruthy();
    expect(screen.getByText("5:12")).toBeTruthy();
    expect(screen.getByText(/Came off early on 2 hangs\. Ended after 2 of 6 sets\./)).toBeTruthy();

    await fireEvent.press(screen.getByLabelText("Effort 8 of 10"));
    expect(screen.getByText("Very hard")).toBeTruthy();
    await fireEvent.press(screen.getByText("Log session"));

    expect(actions.saveSession).toHaveBeenCalledWith({
      id: "session-1",
      workoutId: "rep73",
      gripId: "half",
      date: TODAY,
      loadKg: 4,
      pct: 30,
      misses: 2,
      rpe: 8,
      protocol: expect.objectContaining({ name: "Repeaters 7:3", hangS: 7, sets: 6 }),
    });
    expect(router.navigate).toHaveBeenCalledWith({
      pathname: "/trends",
      params: { workout: "rep73", grip: "half" },
    });
  });
});
