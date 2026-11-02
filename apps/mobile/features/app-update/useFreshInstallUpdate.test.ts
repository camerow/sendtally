import { describe, expect, it, jest } from "@jest/globals";
import { renderHook } from "@testing-library/react-native";
import * as Network from "expo-network";
import { useFreshInstallUpdate } from "./useFreshInstallUpdate";

jest.mock("expo-updates", () => ({
  isEnabled: true,
  isEmbeddedLaunch: true,
  isEmergencyLaunch: false,
  useUpdates: () => ({ isStartupProcedureRunning: true, isUpdatePending: false }),
}));
jest.mock("./restartIntoUpdate", () => ({ restartIntoUpdate: () => Promise.resolve() }));

const connected = (isConnected: boolean | undefined): void => {
  jest.spyOn(Network, "useNetworkState").mockReturnValue({ isConnected });
};

describe("the splash on a fresh install's first launch", () => {
  it("holds while expo-updates checks online", async () => {
    connected(true);
    const { result } = await renderHook(useFreshInstallUpdate);
    expect(result.current).toBe(false);
  });

  it("lets the app open at once offline, with no update to wait for", async () => {
    connected(false);
    const { result } = await renderHook(useFreshInstallUpdate);
    expect(result.current).toBe(true);
  });
});
