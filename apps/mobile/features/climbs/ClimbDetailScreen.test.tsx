import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { Alert, type AlertButton } from "react-native";
import { ClimbDetailScreen } from "./ClimbDetailScreen";

const mockSaveNote = jest.fn();
const mockDeleteNote = jest.fn();

let mockProject = false;
const mockRemove = jest.fn();
jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));
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
          title: "The Arete, V5",
          meta: "The Depot · first tried 2 Sep",
          project: mockProject,
          days: "6",
          tries: "23",
          best: "Flash",
          sessions: [],
          notes: [{ id: "n1", day: "2026-10-30", dateLabel: "Oct 30", note: "Toe hook" }],
        },
      },
    },
    saveNote: mockSaveNote,
    deleteNote: mockDeleteNote,
    remove: mockRemove,
  }),
}));

describe("Climb detail", () => {
  it("deletes the climb from the last row of its ··· menu, once confirmed", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    await render(<ClimbDetailScreen id="c1" />);
    await fireEvent.press(screen.getByLabelText("More"));
    await fireEvent.press(screen.getByText("Delete climb"));
    expect(alert.mock.calls[0]?.slice(0, 2)).toEqual([
      "Delete climb",
      "Delete The Arete? Its sessions stay as logged.",
    ]);
    expect(mockRemove).not.toHaveBeenCalled();
    const buttons = (alert.mock.calls[0]?.[2] ?? []) as AlertButton[];
    await act(async () => buttons.find((b) => b.style === "destructive")?.onPress?.());
    expect(mockRemove).toHaveBeenCalled();
    alert.mockRestore();
  });

  it("introduces the climb and reads its days, tries and best as tiles", async () => {
    await render(<ClimbDetailScreen id="c1" />);
    expect(screen.queryByText("Boulder")).toBeNull();
    expect(screen.getByText("The Arete, V5")).toBeTruthy();
    expect(screen.getByText("The Depot · first tried 2 Sep")).toBeTruthy();
    for (const text of ["6", "Days", "23", "Tries", "Flash", "Best"]) {
      expect(screen.getByText(text)).toBeTruthy();
    }
  });

  it("reads Project as status only, set from Edit climb", async () => {
    await render(<ClimbDetailScreen id="c1" />);
    expect(screen.queryByText("Project")).toBeNull();
    expect(screen.queryByText("Mark as project")).toBeNull();

    mockProject = true;
    await render(<ClimbDetailScreen id="c1" />);
    expect(screen.getByText("Project")).toBeTruthy();
    expect(screen.queryByRole("switch")).toBeNull();
    expect(screen.queryByRole("button", { name: "Project" })).toBeNull();
    mockProject = false;
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
    expect(screen.queryByText("Edit")).toBeNull();
    await fireEvent.press(screen.getByLabelText("More"));
    await fireEvent.press(screen.getByText("Edit climb"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/climb/log",
      params: { climbId: "c1", edit: "1" },
    });
  });

  it("leads with its own Notes, the only place to add one, and no History without a session", async () => {
    await render(<ClimbDetailScreen id="c1" />);
    expect(screen.getByText("Notes")).toBeTruthy();
    expect(screen.getAllByLabelText("Add a note")).toHaveLength(1);
    expect(screen.queryByText(/History/)).toBeNull();
  });

  it("adds a dated note to the climb from the + beside Notes", async () => {
    await render(<ClimbDetailScreen id="c1" />);
    expect(screen.queryByText("Add a note")).toBeNull();
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

  it("lists a note under Notes, and rewrites or deletes it there", async () => {
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
