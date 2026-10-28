import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { ClimbDetailScreen } from "./ClimbDetailScreen";

const mockAddNote = jest.fn(async (_day: string, _note: string) => {});

jest.mock("expo-router", () => ({ router: { push: jest.fn(), replace: jest.fn() } }));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("../../lib/api", () => ({ useApi: () => undefined }));
jest.mock("../../components/BackButton", () => ({ BackButton: () => null }));
jest.mock("../../components/Sheet", () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? children : null,
}));
jest.mock("@sendtally/features/climbs", () => ({
  useClimb: () => ({
    state: {
      status: "ready",
      data: {
        climb: { id: "c1", slug: "the-arete" },
        vm: {
          id: "c1",
          name: "The Arete",
          kicker: "Boulder · V5",
          meta: "The Depot · first tried 2 Sep",
          project: false,
          days: "6",
          tries: "23",
          best: "Flash",
          sessions: [],
        },
      },
    },
    setWorking: jest.fn(),
    rename: jest.fn(),
    addNote: mockAddNote,
  }),
}));

describe("Climb detail", () => {
  it("introduces the climb and reads its days, tries and best as tiles", async () => {
    await render(<ClimbDetailScreen id="c1" />);
    expect(screen.getByText("Boulder · V5")).toBeTruthy();
    expect(screen.getByText("The Arete")).toBeTruthy();
    expect(screen.getByText("The Depot · first tried 2 Sep")).toBeTruthy();
    for (const text of ["6", "Days", "23", "Tries", "Flash", "Best"]) {
      expect(screen.getByText(text)).toBeTruthy();
    }
  });

  it("logs a session on it from the footer", async () => {
    await render(<ClimbDetailScreen id="c1" />);
    await fireEvent.press(screen.getByText("Log session"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/climb/log",
      params: { climbId: "c1" },
    });
  });

  it("adds a dated note to the climb from the menu", async () => {
    await render(<ClimbDetailScreen id="c1" />);
    expect(screen.queryByText("Add a note")).toBeNull();
    await fireEvent.press(screen.getByLabelText("More"));
    await fireEvent.press(screen.getByText("Add a note"));
    await fireEvent.changeText(
      screen.getByPlaceholderText("What happened, what to try next"),
      "Heel on the left"
    );
    await fireEvent.press(screen.getByText("Save"));
    expect(mockAddNote).toHaveBeenCalledWith(expect.any(String), "Heel on the left");
  });
});
