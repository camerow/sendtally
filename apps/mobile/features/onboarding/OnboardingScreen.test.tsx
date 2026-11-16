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
    const text = texts(screen.toJSON() as unknown as Node).join(" ");
    expect(text).not.toMatch(/\bfree\b|price|no card|trial|member|subscri/i);
  });
});
