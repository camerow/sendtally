import { describe, expect, it } from "@jest/globals";
import React from "react";
import { StyleSheet } from "react-native";
import { render, screen } from "@testing-library/react-native";
import { colors } from "@sendtally/design/tokens";
import { EditorHeader } from "./EditorHeader";

const inkOf = (label: string): unknown =>
  StyleSheet.flatten(screen.getByText(label).props.style).color;

describe("EditorHeader", () => {
  it("draws Cancel in neutral ink, and red only when cancelling throws work away", async () => {
    await render(<EditorHeader title="New workout" onCancel={() => {}} onSave={() => {}} />);
    expect(inkOf("Cancel")).toBe(colors.gunmetal);

    await render(
      <EditorHeader
        title="Log workout"
        cancelLabel="Discard"
        cancelDestructive
        onCancel={() => {}}
        onSave={() => {}}
      />
    );
    expect(inkOf("Discard")).toBe(colors.watermelonInk);
  });
});
