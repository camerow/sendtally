import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { UpdateReadyOverlay } from "./UpdateReadyOverlay";

jest.mock("expo-updates", () => ({
  useUpdates: () => ({ isUpdatePending: true, downloadedUpdate: { updateId: "u-1" } }),
  reloadAsync: () => Promise.resolve(),
}));
jest.mock("../../lib/liveSessionStorage", () => ({
  liveSessionStorage: {
    read: () => null,
    write: () => true,
    remove: () => undefined,
    subscribe: () => () => undefined,
    changed: () => undefined,
  },
}));

describe("the update ready overlay", () => {
  it("offers the restart over any screen", async () => {
    await render(<UpdateReadyOverlay hidden={false} />);
    expect(screen.getByText("Restart")).toBeTruthy();
  });

  it("stays off a live workout, and a dismissal holds when it comes back", async () => {
    const { rerender } = await render(<UpdateReadyOverlay hidden />);
    expect(screen.queryByText("Restart")).toBeNull();
    await rerender(<UpdateReadyOverlay hidden={false} />);
    await fireEvent.press(screen.getByLabelText("Not now"));
    await rerender(<UpdateReadyOverlay hidden />);
    await rerender(<UpdateReadyOverlay hidden={false} />);
    expect(screen.queryByText("Restart")).toBeNull();
  });
});
