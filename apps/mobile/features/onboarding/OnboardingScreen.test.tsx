import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { Dimensions } from "react-native";
import Onboarding from "../../app/onboarding";
import { colors } from "@sendtally/design/tokens";

jest.mock("@clerk/clerk-expo", () => ({ useAuth: () => ({ isLoaded: true, isSignedIn: false }) }));
jest.mock("expo-router", () => ({ router: { push: jest.fn() }, Redirect: () => null }));
let mockScales = { boulder: "v", route: "yds" };
jest.mock("@sendtally/features/settings", () => ({
  ...jest.requireActual<object>("@sendtally/features/settings"),
  useDisplayScales: () => mockScales,
}));

type Node = {
  props: { style?: { height?: number; borderRadius?: number; backgroundColor?: string } };
  children: (Node | string)[] | null;
};

const nodes = (node: Node | string | null): Node[] =>
  node === null || typeof node === "string" ? [] : [node, ...(node.children ?? []).flatMap(nodes)];

const texts = (node: Node | string | null): string[] =>
  node === null ? [] : typeof node === "string" ? [node] : (node.children ?? []).flatMap(texts);

const screenText = (): string => texts(screen.toJSON() as unknown as Node).join(" ");

const TITLES = [
  "Custom training blocks",
  "A climbing log",
  "Custom workouts",
  "Hangboard workouts",
  "Exercise metrics",
  "Load tracking",
];

describe("signed-out onboarding screen", () => {
  it("asks What is sendtally?, shows the six cards and the line, and offers both buttons", async () => {
    await render(<Onboarding />);
    expect(screen.getByRole("header", { name: "What is sendtally?" })).toBeTruthy();
    for (const title of TITLES) expect(screen.getByText(title)).toBeTruthy();
    expect(screen.getByText("A plan you build is a plan you finish.")).toBeTruthy();
    expect(screen.getByText("Create account")).toBeTruthy();
    expect(screen.getByText("Sign in")).toBeTruthy();
    expect(screen.getByLabelText("What sendtally does")).toBeTruthy();
    expect(
      screen.getByLabelText(
        "Custom training blocks. Schedule recurring workouts and shape each week of the block. 1 of 6"
      )
    ).toBeTruthy();
  });

  it("says nothing about price, cards, trials or membership, and nothing says Your", async () => {
    await render(<Onboarding />);
    const text = screenText();
    expect(text).not.toMatch(/\bfree\b|price|no card|trial|member|subscri/i);
    expect(text).not.toMatch(/\bYours?\b/);
  });

  it("draws weights in the unit a new account starts with and grades in the climber's scale", async () => {
    mockScales = { boulder: "font", route: "french" };
    await render(<Onboarding />);
    const text = screenText();
    mockScales = { boulder: "v", route: "yds" };
    expect(text).toMatch(/\b135 lb\b/);
    expect(text).not.toMatch(/\bkg\b/);
    expect(text).not.toMatch(/\bV\d/);
  });

  it("fills the segments through the card in view as the cards scroll", async () => {
    await render(<Onboarding />);
    const segments = (): number =>
      nodes(screen.toJSON() as unknown as Node).filter(
        ({ props: { style } }) =>
          style?.height === 4 &&
          style.borderRadius === 2 &&
          style.backgroundColor === colors.gunmetal
      ).length;
    expect(segments()).toBe(1);
    const interval = Dimensions.get("window").width - 76 + 8;
    const scroll = (x: number): Promise<void> =>
      fireEvent.scroll(screen.getByLabelText("What sendtally does"), {
        nativeEvent: { contentOffset: { x, y: 0 } },
      });
    await scroll(interval * 3);
    expect(segments()).toBe(4);
    await scroll(interval * 5 - 40);
    expect(segments()).toBe(6);
    await scroll(interval * 0.4);
    expect(segments()).toBe(1);
  });
});
