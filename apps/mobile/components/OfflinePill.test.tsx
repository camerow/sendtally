import { afterEach, describe, expect, it } from "@jest/globals";
import { onlineManager } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react-native";
import React from "react";
import { ScreenHeader } from "./ScreenHeader";

afterEach(() => {
  onlineManager.setOnline(true);
});

describe("the offline pill", () => {
  it("shows in the header while the phone is offline, and goes when it is back", async () => {
    await render(<ScreenHeader title="Plan" />);
    expect(screen.queryByText("Offline")).toBeNull();
    await act(async () => onlineManager.setOnline(false));
    expect(screen.getByText("Offline")).toBeTruthy();
    await act(async () => onlineManager.setOnline(true));
    expect(screen.queryByText("Offline")).toBeNull();
  });
});
