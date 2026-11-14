import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { restAfter } from "@sendtally/features/workouts";
import { liveRunOf } from "../lib/useLiveRun";
import { LiveBar } from "./LiveBar";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@clerk/react-router", () => ({ useAuth: () => ({ userId: "u1" }) }));
vi.mock("../lib/useAppApi", () => ({ useAppApi: () => ({}) }));
vi.mock("@sendtally/features/gyms", async (actual) => ({
  ...(await actual<object>()),
  useGyms: () => ({ gyms: [], state: { status: "ready" } }),
}));

const { store } = liveRunOf("u1");
let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.useFakeTimers({ now: new Date(2026, 9, 30, 18) });
  store.clear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  store.clear();
  vi.useRealTimers();
});

describe("LiveBar", () => {
  it("shows the workout running, opens it, records it, and carries its rest", () => {
    store.write({
      title: "Leg day",
      workoutId: "w1",
      pathname: "/workout/sets",
      params: { title: "Leg day" },
      startedAt: Date.now(),
      state: { player: "sets", done: [], ticked: ["0:0"] },
    });
    act(() =>
      root.render(
        <MemoryRouter>
          <LiveBar />
        </MemoryRouter>
      )
    );
    expect(container.querySelector(".live-bar-name")?.textContent).toBe("Leg day");
    expect(container.querySelector(".live-bar-open")?.getAttribute("href")).toBe(
      "/app/workout/sets?title=Leg+day"
    );
    expect(container.querySelector(".live-bar-stop")?.getAttribute("href")).toBe(
      "/app/workout/sets?title=Leg+day&end=1"
    );
    expect(container.querySelector(".rest-strip")).toBeNull();
    act(() => store.writeRest(restAfter("0:0", 90, null, Date.now())));
    expect(container.querySelector(".rest-strip-text")?.textContent).toBe("Rest 1:30");
    expect(container.querySelector(".rest-strip-then")?.textContent).toBe("· then set 2");
  });
});
