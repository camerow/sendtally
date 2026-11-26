import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { setPlanPath, usePlanPath, type PlanPath } from "@sendtally/features/settings";
import { ClearQueriesOnSignOut } from "./ClearQueriesOnSignOut";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const auth = vi.hoisted(() => ({ userId: "user_a" }));
vi.mock("@clerk/react-router", () => ({ useAuth: () => ({ isLoaded: true, ...auth }) }));

afterEach(() => {
  document.body.innerHTML = "";
});

describe("ClearQueriesOnSignOut", () => {
  it("drops the wizard's walk when another account signs in", async () => {
    let path: PlanPath | null = null;
    function Probe(): null {
      path = usePlanPath();
      return null;
    }
    const ui = (): React.ReactElement => (
      <QueryClientProvider client={new QueryClient()}>
        <ClearQueriesOnSignOut />
        <Probe />
      </QueryClientProvider>
    );
    const root = createRoot(document.body.appendChild(document.createElement("div")));
    await act(async () => root.render(ui()));
    await act(async () =>
      setPlanPath((p) => ({ ...p, workouts: ["w1"], blockId: "b1", seeded: true }))
    );
    expect(path).toMatchObject({ blockId: "b1" });
    auth.userId = "user_b";
    await act(async () => root.render(ui()));
    expect(path).toMatchObject({ workouts: [], blockId: null, seeded: false });
    act(() => root.unmount());
  });
});
