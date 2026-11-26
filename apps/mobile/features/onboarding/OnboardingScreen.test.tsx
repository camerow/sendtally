import { describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import React from "react";
import Onboarding from "../../app/onboarding";

jest.mock("@clerk/clerk-expo", () => ({ useAuth: () => ({ isLoaded: true, isSignedIn: false }) }));
jest.mock("expo-router", () => ({ router: { push: jest.fn() }, Redirect: () => null }));

type Node = { children: (Node | string)[] | null };

const texts = (node: Node | string | null): string[] =>
  node === null ? [] : typeof node === "string" ? [node] : (node.children ?? []).flatMap(texts);

describe("signed-out onboarding screen", () => {
  it("offers Create account and Sign in, and says nothing about price, cards, trials or membership", async () => {
    await render(<Onboarding />);
    expect(screen.getByText("Create account")).toBeTruthy();
    expect(screen.getByText("Sign in")).toBeTruthy();
    expect(screen.getByText("What is sendtally?")).toBeTruthy();
    expect(
      screen.getByText(/^Sendtally is both a training plan builder and a climbing log\./)
    ).toBeTruthy();
    expect(screen.getByText(/^Sendtally helps you keep an active role/)).toBeTruthy();
    const text = texts(screen.toJSON() as unknown as Node).join(" ");
    expect(text).not.toMatch(/\bfree\b|price|no card|trial|member|subscri/i);
  });

  it("draws the sample as a picture: pyramid without counts, no tiles, nothing that says Your", async () => {
    await render(<Onboarding />);
    const text = texts(screen.toJSON() as unknown as Node).join(" ");
    expect(text).toMatch(/V6/);
    expect(text).not.toMatch(/\d+\/\d+/);
    expect(text).not.toMatch(/avg send|flashed|\bsends?\b|projects?\b/i);
    expect(text).not.toMatch(/\bYour\b/);
  });
});
