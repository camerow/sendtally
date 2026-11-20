import { describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import React from "react";
import { ImportScreen } from "./ImportScreen";

jest.mock("expo-crypto", () => ({ CryptoDigestAlgorithm: {}, digestStringAsync: jest.fn() }));
jest.mock("expo-file-system", () => ({ File: { pickFileAsync: jest.fn() } }));
jest.mock("expo-router", () => ({ router: { dismissTo: jest.fn() } }));
jest.mock("../../lib/api", () => ({ useApi: () => ({}) }));

describe("import", () => {
  it("lists every app it reads", async () => {
    await render(<ImportScreen />);
    expect(screen.getByText("Supported apps")).toBeTruthy();
    expect(screen.getByText("Choose a CSV file")).toBeTruthy();
  });
});
