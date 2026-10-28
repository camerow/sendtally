import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { router } from "expo-router";
import { Alert, type AlertButton } from "react-native";
import type * as LogSession from "@sendtally/features/log-session";
import { tallyDraft, writeStoredDraft } from "@sendtally/features/log-session";
import { liveSessionStorage } from "../../lib/liveSessionStorage";
import { startLiveSession } from "./startLiveSession";

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("../../lib/liveSessionStorage", () => {
  let value: string | null = null;
  return {
    liveSessionStorage: jest
      .requireActual<typeof LogSession>("@sendtally/features/log-session")
      .draftStorage({
        read: () => value,
        write: (next) => {
          value = next;
        },
        remove: () => {
          value = null;
        },
      }),
  };
});

const PLAN = { membershipId: "m1", week: 2 };

const lastButtons = (): AlertButton[] =>
  (jest.mocked(Alert.alert).mock.calls.at(-1)?.[2] ?? []) as AlertButton[];

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
  liveSessionStorage.remove();
});

describe("startLiveSession", () => {
  it("opens a new session named after its workout when none is running", () => {
    startLiveSession(PLAN, "Limit bouldering");
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/session/live",
      params: { membershipId: "m1", week: "2", name: "Limit bouldering" },
    });
  });

  it("warns before replacing a running session, and keeps it on cancel", () => {
    writeStoredDraft(liveSessionStorage, tallyDraft(new Date()), new Date());
    startLiveSession();
    expect(router.push).not.toHaveBeenCalled();
    lastButtons()
      .find((b) => b.style === "cancel")
      ?.onPress?.();
    expect(router.push).not.toHaveBeenCalled();
    expect(liveSessionStorage.read()).not.toBeNull();
  });

  it("resumes the running session instead, keeping it", () => {
    writeStoredDraft(liveSessionStorage, tallyDraft(new Date()), new Date());
    startLiveSession(PLAN, "Limit bouldering");
    lastButtons()
      .find((b) => b.style === undefined)
      ?.onPress?.();
    expect(liveSessionStorage.read()).not.toBeNull();
    expect(router.push).toHaveBeenCalledWith("/session/live");
  });

  it("discards the running session and starts the new one once agreed", () => {
    writeStoredDraft(liveSessionStorage, tallyDraft(new Date()), new Date());
    startLiveSession(PLAN, "Limit bouldering");
    lastButtons()
      .find((b) => b.style === "destructive")
      ?.onPress?.();
    expect(liveSessionStorage.read()).toBeNull();
    expect(router.push).toHaveBeenCalledWith(
      expect.objectContaining({ params: expect.objectContaining({ name: "Limit bouldering" }) })
    );
  });
});
