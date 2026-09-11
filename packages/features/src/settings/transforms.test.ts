import { describe, expect, it } from "vitest";
import type { ConnectionStatus } from "@sendtally/api-client";
import { deleteConfirmationMatches, settingsVM } from "./transforms";

function status(overrides: Partial<ConnectionStatus> = {}): ConnectionStatus {
  return {
    strava: null,
    ...overrides,
  };
}

describe("settingsVM", () => {
  it("reports a disconnected state while loading or without Strava", () => {
    expect(settingsVM(null)).toEqual({
      stravaConnected: false,
      stravaActive: false,
      stravaStatusLabel: "NOT CONNECTED",
      postingEnabled: false,
      postSince: "",
    });
    expect(settingsVM(status()).stravaConnected).toBe(false);
  });

  it("labels an active Strava connection", () => {
    const vm = settingsVM(
      status({
        strava: { athleteId: 42, status: "active", postingEnabled: false, postSince: null },
      })
    );
    expect(vm.stravaConnected).toBe(true);
    expect(vm.stravaActive).toBe(true);
    expect(vm.stravaStatusLabel).toBe("CONNECTED");
  });

  it("carries the posting toggle and start date through as a date input value", () => {
    const vm = settingsVM(
      status({
        strava: {
          athleteId: 42,
          status: "active",
          postingEnabled: true,
          postSince: "2026-03-01T00:00:00Z",
        },
      })
    );
    expect(vm.postingEnabled).toBe(true);
    expect(vm.postSince).toBe("2026-03-01");
  });

  it("flags a dead Strava connection as connected but inactive", () => {
    const vm = settingsVM(
      status({ strava: { athleteId: 42, status: "dead", postingEnabled: false, postSince: null } })
    );
    expect(vm.stravaConnected).toBe(true);
    expect(vm.stravaActive).toBe(false);
    expect(vm.stravaStatusLabel).toBe("RECONNECT NEEDED");
  });
});

describe("deleteConfirmationMatches", () => {
  it("accepts the confirmation word regardless of case or padding", () => {
    expect(deleteConfirmationMatches("DELETE")).toBe(true);
    expect(deleteConfirmationMatches("  delete ")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(deleteConfirmationMatches("")).toBe(false);
    expect(deleteConfirmationMatches("del")).toBe(false);
    expect(deleteConfirmationMatches("delete my account")).toBe(false);
  });
});
