import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import React from "react";
import { NewBestCard } from "./NewBestCard";

describe("NewBestCard", () => {
  it("celebrates the grip, the load and how far it beat the last best", async () => {
    await render(
      <NewBestCard
        best={{ title: "Half crimp +12 kg", meta: "20\u00A0mm · 10s · up 2 kg on your last best" }}
      />
    );
    expect(screen.getByText("New best")).toBeTruthy();
    expect(screen.getByText("Half crimp +12 kg")).toBeTruthy();
    expect(
      screen.getByLabelText(
        "New best, Half crimp +12 kg, 20\u00A0mm · 10s · up 2 kg on your last best"
      )
    ).toBeTruthy();
  });
});
