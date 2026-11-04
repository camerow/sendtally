import { describe, expect, it, jest } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import type { ClimbChange, ClimbSummary } from "@sendtally/api-client";
import { queries } from "@sendtally/features/query";
import type { SendtallyApi } from "@sendtally/api-client";
import { AddClimbScreen } from "./AddClimbScreen";

/** Query keys do not depend on the client, so any stands in for building one. */
const mockApiForKeys = {} as SendtallyApi;

const arete: ClimbSummary = {
  id: "c1",
  slug: "the-arete",
  name: "The Arete",
  grade: { scale: "v", value: 5 },
  discipline: "boulder",
  project: false,
  area_climb_id: "ac-1",
  area: { id: "a1", name: "The Depot" },
  sessions: 2,
  attempts: 4,
  sends: 1,
  first_at: "2026-09-01T18:00:00Z",
  last_at: "2026-09-08T18:00:00Z",
  sent_at: "2026-09-08T18:00:00Z",
  notes: [],
};

const mockUpdateClimb = jest.fn(async (_id: string, _change: ClimbChange) => ({ id: "c1" }));
const mockLogSession = jest.fn();
let mockServerClimb: ClimbSummary = arete;
const mockDeleteClimb = jest.fn(async (_id: string) => ({ deleted: true }));
let mockParams: { climbId?: string; edit?: string } = { climbId: "c1", edit: "1" };

jest.mock("expo-router", () => ({
  router: { back: jest.fn(), dismissTo: jest.fn() },
  useLocalSearchParams: () => mockParams,
}));
jest.mock("../../lib/api", () => {
  const api = new Proxy(
    {
      climbs: async () => ({ climbs: [mockServerClimb] }),
      sessionsWithClimbs: async () => ({ sessions: [], hangSessions: [], activities: [] }),
      updateClimb: (id: string, change: ClimbChange) => mockUpdateClimb(id, change),
      logSession: mockLogSession,
      deleteClimb: (id: string) => mockDeleteClimb(id),
    },
    {
      get: (target, key) => {
        if (key in target) return target[key as keyof typeof target];
        return key === "then" ? undefined : async () => ({ areas: [], climbs: [], activities: [] });
      },
    }
  );
  return { useApi: () => api };
});
jest.mock("@sendtally/features/settings", () => ({
  useGradeScalePrefs: () => ({ scales: { boulder: "v", route: "yds" }, ready: true }),
}));

const renderScreen = async (seed?: (client: QueryClient) => void): Promise<void> => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  seed?.(client);
  await render(
    <QueryClientProvider client={client}>
      <AddClimbScreen />
    </QueryClientProvider>
  );
};

const renderEdit = async (): Promise<void> => {
  mockParams = { climbId: "c1", edit: "1" };
  await renderScreen();
  await screen.findByDisplayValue("The Arete");
};

describe("editing a climb", () => {
  it("edits only the climb itself: name, crag, grade and project, nothing a session holds", async () => {
    await renderEdit();
    expect(screen.getByText("Edit climb")).toBeTruthy();
    expect(screen.getByDisplayValue("The Depot")).toBeTruthy();
    expect(screen.queryByText("Date")).toBeNull();
    expect(screen.queryByText("Delete climb")).toBeNull();
    expect(screen.queryByText("Pinned to the top until you send it")).toBeNull();
    expect(screen.getByRole("switch", { name: "Project" }).props.accessibilityState).toMatchObject({
      checked: false,
    });
  });

  it("never saves a stale project flag back over the climb's own", async () => {
    mockServerClimb = { ...arete, project: true };
    mockParams = { climbId: "c1", edit: "1" };
    await renderScreen((client) => {
      client.setQueryData(queries.climbs(mockApiForKeys).queryKey, [arete], { updatedAt: 0 });
      client.setQueryData(
        queries.sessionsWithClimbs(mockApiForKeys).queryKey,
        { sessions: [], hangSessions: [], activities: [] },
        { updatedAt: 0 }
      );
    });
    await screen.findByDisplayValue("The Arete");
    await waitFor(() =>
      expect(
        screen.getByRole("switch", { name: "Project" }).props.accessibilityState
      ).toMatchObject({ checked: true })
    );
    await fireEvent.press(screen.getByText("Save"));
    expect(mockUpdateClimb.mock.calls.at(-1)?.[1]).not.toHaveProperty("working");
    mockServerClimb = arete;
  });

  it("marks a sent climb as a project with the edit", async () => {
    await renderEdit();
    await fireEvent.press(screen.getByRole("switch", { name: "Project" }));
    await fireEvent.press(screen.getByText("Save"));
    expect(mockUpdateClimb).toHaveBeenLastCalledWith("c1", {
      areaId: "a1",
      areaClimbId: "ac-1",
      working: true,
    });
  });

  it("saves a new grade, keeps its crag and link, and goes back to the climb", async () => {
    await renderEdit();
    await fireEvent.press(screen.getByText("V6"));
    await fireEvent.press(screen.getByText("Save"));
    expect(mockUpdateClimb).toHaveBeenCalledWith("c1", {
      areaId: "a1",
      areaClimbId: "ac-1",
      grade: { scale: "v", value: 6 },
    });
    expect(mockLogSession).not.toHaveBeenCalled();
    expect(router.dismissTo).toHaveBeenCalledWith({
      pathname: "/climb/[id]",
      params: { id: "c1" },
    });
  });

  it("drops the Areas climb link when the crag is cleared, sending no unchanged grade", async () => {
    await renderEdit();
    await fireEvent.changeText(screen.getByDisplayValue("The Depot"), "");
    await fireEvent.press(screen.getByText("Save"));
    expect(mockUpdateClimb).toHaveBeenLastCalledWith("c1", {
      areaId: null,
      areaClimbId: null,
    });
  });
});

describe("logging a session on a climb", () => {
  it("heads the page with the climb and asks only for the date, tries, result and notes", async () => {
    mockParams = { climbId: "c1" };
    await renderScreen();
    expect(await screen.findByText("The Arete, V5")).toBeTruthy();
    expect(screen.queryByText("Add climb")).toBeNull();
    for (const asked of ["Date", "Notes"]) expect(screen.getByText(asked)).toBeTruthy();
    for (const identity of ["The Arete", "The Depot"]) {
      expect(screen.queryByDisplayValue(identity)).toBeNull();
    }
    for (const notAsked of ["Grade", "Project", "Delete climb"]) {
      expect(screen.queryByText(notAsked)).toBeNull();
    }
  });
});
