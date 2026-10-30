import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { HistoryList } from "./HistoryList";
import type { HistoryItem } from "./types";

const item = (n: number, over: Partial<HistoryItem> = {}): HistoryItem => ({
  id: `s${n}`,
  date: `${n} Oct`,
  name: "Pull day",
  meta: `pull-up +${n} kg`,
  rpe: 7,
  ...over,
});

describe("HistoryList", () => {
  it("counts every session, shows five and the rest on asking", async () => {
    await render(
      <HistoryList items={[1, 2, 3, 4, 5, 6, 7].map((n) => item(n))} onOpen={jest.fn()} />
    );
    expect(screen.getByText("History · 7 sessions")).toBeTruthy();
    expect(screen.getByText("pull-up +5 kg")).toBeTruthy();
    expect(screen.queryByText("pull-up +6 kg")).toBeNull();
    await fireEvent.press(screen.getByText("Show all 7"));
    expect(screen.getByText("pull-up +7 kg")).toBeTruthy();
    expect(screen.getByText("Show fewer")).toBeTruthy();
  });

  it("opens a row's session, but not the one already open", async () => {
    const onOpen = jest.fn();
    await render(
      <HistoryList
        items={[item(24, { name: "This session", current: true }), item(17)]}
        onOpen={onOpen}
      />
    );
    await fireEvent.press(screen.getByText("This session"));
    expect(onOpen).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByText("pull-up +17 kg"));
    expect(onOpen).toHaveBeenCalledWith("s17");
  });

  it("shows effort as a dot and RPE, and nothing when unrated", async () => {
    await render(
      <HistoryList items={[item(1, { rpe: 8 }), item(2, { rpe: null })]} onOpen={jest.fn()} />
    );
    expect(screen.getAllByText(/^RPE/).map((n) => n.props.children)).toEqual(["RPE 8"]);
  });

  it("is left out with nothing but the current session", async () => {
    await render(<HistoryList items={[item(1, { current: true })]} onOpen={jest.fn()} />);
    expect(screen.queryByText(/^History/)).toBeNull();
  });
});
