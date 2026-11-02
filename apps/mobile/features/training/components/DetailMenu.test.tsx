import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { DetailMenu } from "./DetailMenu";

jest.mock("../../../components/Sheet", () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? children : null,
}));

const rows = (): Parameters<typeof DetailMenu>[0]["rows"] => [
  { icon: "copy", title: "Duplicate", hint: "Copy it", onPress: jest.fn() },
  {
    icon: "strava",
    title: "Post to Strava",
    hint: "As a workout",
    onPress: jest.fn(),
    keepOpen: true,
  },
  {
    icon: "trash",
    title: "Delete workout",
    hint: "Its sessions stay",
    onPress: jest.fn(),
    danger: true,
  },
];

describe("DetailMenu", () => {
  it("opens from ··· on each row with its hint, and closes on Cancel", async () => {
    await render(<DetailMenu rows={rows()} />);
    expect(screen.queryByText("Duplicate")).toBeNull();
    await fireEvent.press(screen.getByLabelText("More"));
    expect(screen.getByText("Copy it")).toBeTruthy();
    expect(screen.getByText("Its sessions stay")).toBeTruthy();
    await fireEvent.press(screen.getByText("Cancel"));
    expect(screen.queryByText("Duplicate")).toBeNull();
  });

  it("closes before a row runs, unless the row keeps it open", async () => {
    const menu = rows();
    await render(<DetailMenu rows={menu} />);
    await fireEvent.press(screen.getByLabelText("More"));
    await fireEvent.press(screen.getByText("Post to Strava"));
    expect(menu[1]?.onPress).toHaveBeenCalled();
    expect(screen.getByText("Post to Strava")).toBeTruthy();
    await fireEvent.press(screen.getByText("Delete workout"));
    expect(menu[2]?.onPress).toHaveBeenCalled();
    expect(screen.queryByText("Delete workout")).toBeNull();
  });
});
