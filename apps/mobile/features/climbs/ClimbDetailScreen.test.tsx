import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { Alert, type AlertButton } from "react-native";
import { ClimbDetailScreen } from "./ClimbDetailScreen";

const mockSaveNote = jest.fn();
const mockDeleteNote = jest.fn();

jest.mock("expo-router", () => ({ router: { push: jest.fn(), replace: jest.fn() } }));
jest.mock("expo-crypto", () => ({ randomUUID: () => "n-new" }));
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
          kicker: "Boulder",
          title: "The Arete, V5",
          meta: "The Depot · first tried 2 Sep",
          project: false,
          days: "6",
          tries: "23",
          best: "Flash",
          sessions: [],
          notes: [{ id: "n1", day: "2026-10-30", dateLabel: "Oct 30", note: "Toe hook" }],
        },
      },
    },
    setWorking: jest.fn(),
    saveNote: mockSaveNote,
    deleteNote: mockDeleteNote,
  }),
}));

describe("Climb detail", () => {
  it("introduces the climb and reads its days, tries and best as tiles", async () => {
    await render(<ClimbDetailScreen id="c1" />);
    expect(screen.getByText("Boulder")).toBeTruthy();
    expect(screen.getByText("The Arete, V5")).toBeTruthy();
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

  it("edits the climb itself from the bar", async () => {
    await render(<ClimbDetailScreen id="c1" />);
    await fireEvent.press(screen.getByText("Edit"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/climb/log",
      params: { climbId: "c1", edit: "1" },
    });
  });

  it("adds a dated note to the climb from the + beside Notes", async () => {
    await render(<ClimbDetailScreen id="c1" />);
    expect(screen.queryByText("Add a note")).toBeNull();
    expect(screen.queryByLabelText("More")).toBeNull();
    await fireEvent.press(screen.getByLabelText("Add a note"));
    await fireEvent.changeText(
      screen.getByPlaceholderText("What happened, what to try next"),
      "Heel on the left"
    );
    await fireEvent.press(screen.getByText("Save"));
    expect(mockSaveNote).toHaveBeenCalledWith({
      day: expect.any(String),
      note: "Heel on the left",
    });
  });

  it("lists a note with no session in its history, and rewrites or deletes it there", async () => {
    await render(<ClimbDetailScreen id="c1" />);
    await fireEvent.press(screen.getByText("Toe hook"));
    await fireEvent.changeText(screen.getByDisplayValue("Toe hook"), "Toe hook right");
    await fireEvent.press(screen.getByText("Save"));
    expect(mockSaveNote).toHaveBeenCalledWith({
      id: "n1",
      day: "2026-10-30",
      note: "Toe hook right",
    });

    jest
      .spyOn(Alert, "alert")
      .mockImplementation((_title, _body, buttons?: AlertButton[]) =>
        buttons?.find((b) => b.style === "destructive")?.onPress?.()
      );
    await fireEvent.press(screen.getByText("Toe hook"));
    await fireEvent.press(screen.getByText("Delete note"));
    expect(mockDeleteNote).toHaveBeenCalledWith("n1");
  });
});
