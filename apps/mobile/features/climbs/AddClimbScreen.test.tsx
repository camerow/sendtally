import { describe, expect, it, jest } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import type { ClimbChange, ClimbSummary } from "@sendtally/api-client";
import { AddClimbScreen } from "./AddClimbScreen";

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
};

const mockUpdateClimb = jest.fn(async (_id: string, _change: ClimbChange) => ({ id: "c1" }));
const mockLogSession = jest.fn();

jest.mock("expo-router", () => ({
  router: { back: jest.fn(), dismissTo: jest.fn() },
  useLocalSearchParams: () => ({ climbId: "c1", edit: "1" }),
}));
jest.mock("../../lib/api", () => {
  const api = new Proxy(
    {
      climbs: async () => ({ climbs: [arete] }),
      sessionsWithClimbs: async () => ({ sessions: [], hangSessions: [], activities: [] }),
      updateClimb: (id: string, change: ClimbChange) => mockUpdateClimb(id, change),
      logSession: mockLogSession,
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

const renderEdit = async (): Promise<void> => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await render(
    <QueryClientProvider client={client}>
      <AddClimbScreen />
    </QueryClientProvider>
  );
  await screen.findByDisplayValue("The Arete");
};

describe("editing a climb", () => {
  it("edits only the climb itself: name, crag and grade, nothing a session holds", async () => {
    await renderEdit();
    expect(screen.getByText("Edit climb")).toBeTruthy();
    expect(screen.getByDisplayValue("The Depot")).toBeTruthy();
    for (const sessionOnly of ["Date", "Project"]) {
      expect(screen.queryByText(sessionOnly)).toBeNull();
    }
  });

  it("saves the new grade on the climb, keeps its crag and link, and goes back to it", async () => {
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

  it("drops the Areas climb link when the crag is cleared", async () => {
    await renderEdit();
    await fireEvent.changeText(screen.getByDisplayValue("The Depot"), "");
    await fireEvent.press(screen.getByText("Save"));
    expect(mockUpdateClimb).toHaveBeenLastCalledWith("c1", {
      areaId: null,
      areaClimbId: null,
      grade: { scale: "v", value: 5 },
    });
  });
});
