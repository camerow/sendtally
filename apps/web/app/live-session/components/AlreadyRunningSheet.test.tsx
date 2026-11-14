import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { tallyDraft, writeStoredDraft } from "@sendtally/features/log-session";
import { liveRunOf } from "../../lib/useLiveRun";
import { liveSessionStorageOf } from "../../lib/useLiveSessionStorage";
import { askingStore, startLive } from "@sendtally/features/workouts";
import { running } from "../startLive";
import { AlreadyRunningSheet } from "./AlreadyRunningSheet";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute("open", "");
};

vi.mock("@clerk/react-router", () => ({ useAuth: () => ({ userId: "u1" }) }));

const storage = liveSessionStorageOf("u1");
let container: HTMLDivElement;
let root: Root;
let went: string[];

const go = (to: string): void => void went.push(to);
const button = (label: string): HTMLButtonElement =>
  Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find(
    (b) => b.textContent === label
  )!;

beforeEach(() => {
  went = [];
  storage.remove();
  askingStore.close();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<AlreadyRunningSheet />));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  storage.remove();
});

const runOne = (): void =>
  act(() => void writeStoredDraft(storage, tallyDraft(new Date()), new Date(), undefined));

describe("starting while a session runs", () => {
  it("starts straight away when nothing runs", () => {
    const start = vi.fn();
    startLive(running(storage, liveRunOf("u1").store, go), start);
    expect(start).toHaveBeenCalled();
    expect(document.querySelector("dialog")).toBeNull();
  });

  it("asks first, and resumes the running one", () => {
    runOne();
    const start = vi.fn();
    act(() => startLive(running(storage, liveRunOf("u1").store, go), start));
    expect(document.body.textContent).toContain("Already running");
    act(() => button("Resume").click());
    expect(went).toEqual(["/app/sessions/live"]);
    expect(start).not.toHaveBeenCalled();
  });

  it("records the running one, and starts the new one once it is saved", () => {
    runOne();
    const start = vi.fn();
    act(() => startLive(running(storage, liveRunOf("u1").store, go), start));
    act(() => button("Record").click());
    expect(went).toEqual(["/app/sessions/live?finish=1"]);
    expect(start).not.toHaveBeenCalled();
    act(() => storage.remove());
    expect(start).toHaveBeenCalled();
  });

  it("discards the running one only once confirmed, then starts", () => {
    runOne();
    const start = vi.fn();
    act(() => startLive(running(storage, liveRunOf("u1").store, go), start));
    act(() => button("Discard").click());
    expect(storage.read()).not.toBeNull();
    act(() => button("Discard").click());
    expect(storage.read()).toBeNull();
    expect(start).toHaveBeenCalled();
  });

  it("records a running workout through its player, and starts the new one once it is saved", () => {
    const { store } = liveRunOf("u1");
    act(() =>
      store.write({
        title: "Leg day",
        workoutId: "w1",
        pathname: "/workout/sets",
        params: { title: "Leg day" },
        startedAt: Date.now(),
        state: { player: "sets", done: [], ticked: [] },
      })
    );
    const start = vi.fn();
    act(() => startLive(running(storage, store, go), start));
    expect(document.body.textContent).toContain("Leg day");
    act(() => button("Record").click());
    expect(went).toEqual(["/app/workout/sets?title=Leg+day&end=1"]);
    expect(start).not.toHaveBeenCalled();
    act(() => store.clear());
    expect(start).toHaveBeenCalled();
  });
});
