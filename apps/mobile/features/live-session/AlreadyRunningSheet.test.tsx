import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { Alert, type AlertButton } from "react-native";
import type * as LogSession from "@sendtally/features/log-session";
import { tallyDraft, writeStoredDraft } from "@sendtally/features/log-session";
import { liveRunStorage } from "../../lib/liveRunStorage";
import { liveSessionStorage } from "../../lib/liveSessionStorage";
import { AlreadyRunningSheet } from "./AlreadyRunningSheet";
import { clearLiveRun, readLiveRun, writeLiveRun, type LiveRun } from "./liveRun";
import { startLive } from "./startLive";
import { startLiveSession } from "./startLiveSession";

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("../../components/Sheet", () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? children : null,
}));
const memory = (): LogSession.DraftStorage => {
  let value: string | null = null;
  return jest.requireActual<typeof LogSession>("@sendtally/features/log-session").draftStorage({
    read: () => value,
    write: (next) => {
      value = next;
    },
    remove: () => {
      value = null;
    },
  });
};
jest.mock("../../lib/liveSessionStorage", () => ({ liveSessionStorage: memory() }));
jest.mock("../../lib/liveRunStorage", () => ({ liveRunStorage: memory() }));

const HANGS: LiveRun = {
  title: "Max hangs",
  workoutId: "w1",
  pathname: "/workout/timer",
  params: { workoutId: "w1", gripId: "half", session: "0" },
  startedAt: 0,
  state: { player: "checklist", ticked: [], count: 1 },
};

const lastButtons = (): AlertButton[] =>
  (jest.mocked(Alert.alert).mock.calls.at(-1)?.[2] ?? []) as AlertButton[];

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
  liveSessionStorage.remove();
  liveRunStorage.remove();
});

describe("starting while something runs", () => {
  it("starts straight away when nothing runs", () => {
    startLiveSession({ membershipId: "m1", week: 2, focus: null }, "Limit bouldering");
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/session/live",
      params: { membershipId: "m1", week: "2", name: "Limit bouldering" },
    });
  });

  it("asks first, naming both, and resumes the running workout", async () => {
    writeLiveRun(HANGS);
    const start = jest.fn();
    await render(<AlreadyRunningSheet />);
    await act(async () => startLive("Pull and core", start));
    expect(screen.getByText("Max hangs is still going")).toBeTruthy();
    expect(screen.getByText(/to start Pull and core/)).toBeTruthy();
    await fireEvent.press(screen.getByText("Resume Max hangs"));
    expect(router.push).toHaveBeenCalledWith({ pathname: "/workout/timer", params: HANGS.params });
    expect(start).not.toHaveBeenCalled();
    expect(screen.queryByText("Max hangs is still going")).toBeNull();
  });

  it("records the running one on its review, and starts the new one once it is saved", async () => {
    writeLiveRun(HANGS);
    const start = jest.fn();
    await render(<AlreadyRunningSheet />);
    await act(async () => startLive("Pull and core", start));
    await fireEvent.press(screen.getByText("Record Max hangs"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/workout/timer",
      params: { ...HANGS.params, end: "1" },
    });
    expect(start).not.toHaveBeenCalled();
    await act(async () => clearLiveRun());
    expect(start).toHaveBeenCalledTimes(1);
  });

  it("discards a climbing session only once confirmed, then starts", async () => {
    writeStoredDraft(liveSessionStorage, tallyDraft(new Date()), new Date());
    const start = jest.fn();
    await render(<AlreadyRunningSheet />);
    await act(async () => startLive("Pull and core", start));
    await fireEvent.press(screen.getByText(/^Discard /));
    expect(start).not.toHaveBeenCalled();
    await act(async () =>
      lastButtons()
        .find((b) => b.style === "destructive")
        ?.onPress?.()
    );
    expect(liveSessionStorage.read()).toBeNull();
    expect(start).toHaveBeenCalledTimes(1);
  });

  it("keeps everything on cancel", async () => {
    writeLiveRun(HANGS);
    const start = jest.fn();
    await render(<AlreadyRunningSheet />);
    await act(async () => startLive("Pull and core", start));
    await fireEvent.press(screen.getByText("Cancel"));
    expect(start).not.toHaveBeenCalled();
    expect(readLiveRun()).toEqual(HANGS);
  });
});
