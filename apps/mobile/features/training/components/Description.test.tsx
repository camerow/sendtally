import { describe, expect, it, jest } from "@jest/globals";
import React from "react";
import { Linking } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Description } from "./Description";

const lines = (n: number) => ({ nativeEvent: { lines: Array.from({ length: n }, () => ({})) } });

/** Lays the hidden measuring copy out as if each unit took these lines; it comes first. */
async function layOut(units: [string, number][]): Promise<void> {
  for (const [text, n] of units) {
    const [hidden] = screen.getAllByText(text, { includeHiddenElements: true });
    if (hidden !== undefined) await fireEvent(hidden, "textLayout", lines(n));
  }
}

describe("Description", () => {
  it("renders nothing for an empty description", async () => {
    await render(<Description text="  " fold />);
    expect(screen.toJSON()).toBeNull();
  });

  it("shows paragraphs, bullets, numbered steps and links that open the whole address", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await render(
      <Description
        text={
          "Warm up.\n\n- Shoulders down\n1. Hang\nSee https://www.sendtally.com/training/hangboard"
        }
      />
    );
    expect(screen.getByText("Warm up.")).toBeTruthy();
    expect(screen.getByText("•")).toBeTruthy();
    expect(screen.getByText("Shoulders down")).toBeTruthy();
    expect(screen.getByText("1.")).toBeTruthy();
    await fireEvent.press(screen.getByText("sendtally.com/training/…"));
    expect(open).toHaveBeenCalledWith("https://www.sendtally.com/training/hangboard");
  });

  it("folds past five lines behind More, opening in place and folding again with Less", async () => {
    await render(<Description text={"One\n\nTwo\n\nThree"} fold />);
    await layOut([
      ["One", 2],
      ["Two", 4],
      ["Three", 1],
    ]);
    expect(screen.getByText("One")).toBeTruthy();
    expect(screen.getByText("Two").props.numberOfLines).toBe(3);
    expect(screen.queryByText("Three")).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "More" }));
    expect(screen.getByText("Three")).toBeTruthy();
    expect(screen.getByText("Two").props.numberOfLines).toBeUndefined();
    await fireEvent.press(screen.getByRole("button", { name: "Less" }));
    expect(screen.queryByText("Three")).toBeNull();
  });

  it("folds at the lines asked, and can start open with Less", async () => {
    await render(<Description text={"One\n\nTwo\n\nThree"} fold={3} startOpen />);
    await layOut([
      ["One", 2],
      ["Two", 2],
      ["Three", 1],
    ]);
    expect(screen.getByText("Three")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Less" }));
    expect(screen.queryByText("Three")).toBeNull();
    expect(screen.getByText("Two").props.numberOfLines).toBe(1);
  });

  it("has no More when it all fits", async () => {
    await render(<Description text={"One\n\nTwo"} fold />);
    await layOut([
      ["One", 2],
      ["Two", 3],
    ]);
    expect(screen.getByText("Two")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "More" })).toBeNull();
  });
});
