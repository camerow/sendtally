import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
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
          eyebrow: "V5",
          project: false,
          days: "1",
          tries: "3",
          best: "-",
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
  it("adds a dated note to the climb", async () => {
    await render(<ClimbDetailScreen id="c1" />);
    await fireEvent.press(screen.getByText("Add a note"));
    await fireEvent.changeText(
      screen.getByPlaceholderText("What happened, what to try next"),
      "Heel on the left"
    );
    await fireEvent.press(screen.getByText("Save"));
    expect(mockAddNote).toHaveBeenCalledWith(expect.any(String), "Heel on the left");
  });
});
