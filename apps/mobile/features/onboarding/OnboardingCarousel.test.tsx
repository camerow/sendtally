import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import React from "react";
import { StyleSheet, type StyleProp, type TextStyle } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { artFit, OnboardingCarousel } from "./OnboardingCarousel";
import { ART_CARD_HEIGHT } from "./SlideArt";

type Node = { props: { style?: unknown; children?: unknown }; children: (Node | string)[] };

const nodes = (node: Node | string, out: Node[] = []): Node[] => {
  if (typeof node === "string") return out;
  out.push(node);
  node.children.forEach((c) => nodes(c, out));
  return out;
};

const styleOf = (n: Node): TextStyle =>
  StyleSheet.flatten(n.props.style as StyleProp<TextStyle>) ?? {};

const show = async (): Promise<Node[]> => {
  await render(<OnboardingCarousel pageWidth={390} />);
  return nodes(screen.toJSON() as unknown as Node);
};

describe("onboarding carousel", () => {
  it("explains the log, then exercises, workouts and blocks, one slide each", async () => {
    await show();
    for (const text of [
      "What is sendtally?",
      "A climbing log for your ascents.",
      "Exercises",
      "Also a training app, built to be flexible.",
      "Workouts",
      "Workouts group your exercises.",
      "Blocks",
      "Blocks are your training plan.",
    ])
      expect(screen.getByText(text)).toBeTruthy();
    expect(screen.getByLabelText("Grade pyramid")).toBeTruthy();
  });

  it("drops the Strava slide and says nothing about price or syncing", async () => {
    const all = (await show()).flatMap((n) => n.children.filter((c) => typeof c === "string"));
    const text = all.join(" ");
    expect(text).not.toMatch(/strava|re-sync|free|price|trial|member/i);
  });

  it("keeps red text off the slides", async () => {
    const red = (await show()).filter((n) => styleOf(n).color === colors.labelAccent);
    expect(red).toEqual([]);
  });

  it("gives every slide's art the same height, so it never jumps", async () => {
    const cards = (await show()).filter((n) => styleOf(n).height === ART_CARD_HEIGHT);
    expect(cards).toHaveLength(4);
  });

  it("keeps the 310 art box where it fits, and scales the art down whole on a short phone", () => {
    expect(artFit(560)).toEqual({ height: 310, scale: 1 });
    expect(artFit(394)).toEqual({ height: 200, scale: 200 / 310 });
  });
});
