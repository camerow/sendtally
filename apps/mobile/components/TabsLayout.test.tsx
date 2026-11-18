import { describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import React from "react";
import { Text as MockText } from "react-native";
import TabsLayout from "../app/(tabs)/_layout";

jest.mock("expo-router", () => {
  const Tabs = ({ children }: { children: React.ReactNode }): React.ReactNode => children;
  Tabs.Screen = ({ name, options }: { name: string; options: { tabBarLabel: string } }) => (
    <MockText>{`${name}: ${options.tabBarLabel}`}</MockText>
  );
  return { Tabs, Redirect: ({ href }: { href: string }) => <MockText>{`to ${href}`}</MockText> };
});
let mockShow: boolean | null = false;
jest.mock("@sendtally/features/settings", () => ({ useFirstRun: () => mockShow }));
jest.mock("../lib/api", () => ({ useApi: () => ({}) }));
jest.mock("expo-router/tabs", () => ({ BottomTabBar: () => null }));
jest.mock("../features/live-session/LiveBar", () => ({ LiveBar: () => null }));

describe("Tabs", () => {
  it("are Plan, Log, Train and Stats, in that order", async () => {
    await render(<TabsLayout />);
    expect(screen.getAllByText(/: /).map((n) => n.props.children)).toEqual([
      "today: Plan",
      "sessions: Log",
      "train: Train",
      "stats: Stats",
    ]);
  });

  it("send a new account to first run, and wait for the status before choosing", async () => {
    mockShow = true;
    await render(<TabsLayout />);
    expect(screen.getByText("to /first-run")).toBeTruthy();
    mockShow = null;
    await render(<TabsLayout />);
    expect(screen.queryByText(/: |to /)).toBeNull();
    mockShow = false;
  });
});
