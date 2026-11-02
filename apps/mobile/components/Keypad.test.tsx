import { describe, expect, it, jest } from "@jest/globals";
import React from "react";
import type * as MockReact from "react";
import type * as MockReactNative from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Keypad, type KeypadMode } from "./Keypad";

type MockSheetProps = {
  visible: boolean;
  onClose: () => void;
  closeLabel: string;
  children: React.ReactNode;
};

jest.mock("./Sheet", () => {
  const { createElement, Fragment } = jest.requireActual<typeof MockReact>("react");
  const { Pressable } = jest.requireActual<typeof MockReactNative>("react-native");
  return {
    Sheet: ({ visible, onClose, closeLabel, children }: MockSheetProps) =>
      visible
        ? createElement(
            Fragment,
            null,
            createElement(Pressable, { accessibilityLabel: closeLabel, onPress: onClose }),
            children
          )
        : null,
  };
});

type Handlers = { onCommit: jest.Mock; onClose: jest.Mock; onNext: jest.Mock };

async function renderPad(mode: KeypadMode, value: number, next = true): Promise<Handlers> {
  const handlers = { onCommit: jest.fn(), onClose: jest.fn(), onNext: jest.fn() };
  await render(
    <Keypad
      visible
      label="Hang"
      mode={mode}
      value={value}
      onCommit={handlers.onCommit}
      onClose={handlers.onClose}
      onNext={next ? handlers.onNext : undefined}
    />
  );
  return handlers;
}

async function press(...keys: string[]): Promise<void> {
  for (const key of keys) await fireEvent.press(screen.getByLabelText(key));
}

describe("Keypad", () => {
  it("fills a time from the right and carries the overflow on Done", async () => {
    const { onCommit, onClose } = await renderPad({ kind: "time" }, 7);
    expect(screen.getByText("00:00:07")).toBeTruthy();
    await press("9", "0");
    expect(screen.getByText("00:00:90")).toBeTruthy();
    await press("Done");
    expect(onCommit).toHaveBeenCalledWith(90);
    expect(onClose).toHaveBeenCalled();
  });

  it("steps a time by 30 seconds, never below zero", async () => {
    const { onCommit } = await renderPad({ kind: "time" }, 7);
    await press("1", "0", "Subtract 30s", "Add 30s", "Add 30s");
    expect(screen.getByText("00:01:00")).toBeTruthy();
    await press("Done");
    expect(onCommit).toHaveBeenCalledWith(60);
  });

  it("commits nothing when closed unchanged", async () => {
    const { onCommit, onClose } = await renderPad({ kind: "time" }, 1200);
    await press("Done");
    expect(onCommit).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("commits and closes on a tap outside", async () => {
    const { onCommit, onClose } = await renderPad({ kind: "time" }, 7);
    await press("2", "0", "Close");
    expect(onCommit).toHaveBeenCalledWith(20);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("commits, closes and calls through on Next", async () => {
    const { onCommit, onClose, onNext } = await renderPad({ kind: "time" }, 7);
    await press("5", "Next");
    expect(onCommit).toHaveBeenCalledWith(5);
    expect(onClose).toHaveBeenCalled();
    expect(onNext).toHaveBeenCalled();
  });

  it("leaves Next out without a following field", async () => {
    await renderPad({ kind: "time" }, 7, false);
    expect(screen.queryByLabelText("Next")).toBeNull();
  });

  it("types a signed decimal weight and steps by its own step", async () => {
    const { onCommit } = await renderPad(
      { kind: "number", step: 2.5, min: -200, decimals: true, signed: true, unit: "kg" },
      20
    );
    await press("7", "Decimal point", "5", "Change sign");
    expect(screen.getByText("−7.5 kg")).toBeTruthy();
    await press("Add 2.5", "Done");
    expect(onCommit).toHaveBeenCalledWith(-5);
  });

  it("offers no sign or decimal where a count has none", async () => {
    const { onCommit } = await renderPad({ kind: "number", step: 1, min: 1 }, 5);
    expect(screen.queryByLabelText("Change sign")).toBeNull();
    expect(screen.queryByLabelText("Decimal point")).toBeNull();
    await press("1", "00", "Subtract 1", "Done");
    expect(onCommit).toHaveBeenCalledWith(99);
  });
});
