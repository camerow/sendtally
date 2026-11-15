import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { ImportScreen } from "./ImportScreen";

jest.mock("expo-crypto", () => ({ CryptoDigestAlgorithm: {}, digestStringAsync: jest.fn() }));
jest.mock("expo-file-system", () => ({ File: { pickFileAsync: jest.fn() } }));
jest.mock("expo-router", () => ({ router: { dismissTo: jest.fn() } }));
jest.mock("../../lib/api", () => ({ useApi: () => ({}) }));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("import", () => {
  it("opened from first run, shows only the picked source's steps and its site", async () => {
    await render(<ImportScreen then="/first-run" from="mountainProject" />);
    expect(screen.getByText("Get your log out")).toBeTruthy();
    expect(screen.getByText("Select “Export CSV” to download the file.")).toBeTruthy();
    expect(screen.getByText("Open mountainproject.com")).toBeTruthy();
    expect(screen.queryByText("Supported apps")).toBeNull();
  });

  it("goes on to first run's days step with Skip for now", async () => {
    await render(<ImportScreen then="/first-run" from="kaya" />);
    expect(screen.getByText("Search for the Kaya export")).toBeTruthy();
    await fireEvent.press(screen.getByText("Skip for now"));
    expect(router.dismissTo).toHaveBeenCalledWith({
      pathname: "/first-run",
      params: { later: "1" },
    });
  });

  it("opened from Settings, lists every app and has no Skip for now", async () => {
    await render(<ImportScreen then="/profile" />);
    expect(screen.getByText("Supported apps")).toBeTruthy();
    expect(screen.queryByText("Skip for now")).toBeNull();
  });
});
