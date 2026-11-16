import { describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import React from "react";
import type { Item, WorkoutKind } from "@sendtally/core/hang";
import { ItemEditor } from "./ItemEditor";

const renderItem = async (kind: WorkoutKind, item: Item): Promise<void> => {
  await render(
    <ItemEditor
      kind={kind}
      item={item}
      name="Row"
      unit="kg"
      onChange={jest.fn()}
      onRemove={jest.fn()}
      onSwap={jest.fn()}
    />
  );
};

describe("ItemEditor", () => {
  it("keeps a lone last dose field at half width, beside an empty slot", async () => {
    await renderItem("climbing", { exercise: "Row", doses: [{ sets: 3, reps: 4 }] });
    expect(screen.getByTestId("dose-spacer")).toBeTruthy();
  });

  it("adds no empty slot when the fields pair up", async () => {
    await renderItem("strength", { exercise: "Row", doses: [{ sets: 3, reps: 8 }] });
    expect(screen.queryByTestId("dose-spacer")).toBeNull();
  });
});
