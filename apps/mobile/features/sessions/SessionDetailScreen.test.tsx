import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import React from "react";
import { Alert, Linking, type AlertButton } from "react-native";
import type * as ReactNative from "react-native";
import SessionDetailScreen from "../../app/session/[fingerprint]";

const mockCreateEntry = jest.fn(async (_input: unknown) => ({ entry: {} }));
const mockApi = { createEntry: (input: unknown) => mockCreateEntry(input) };
const mockRemove = jest.fn<(fingerprint: string) => void>();
const mockReload = jest.fn(async () => undefined);
let mockState: unknown;
let mockStrava: unknown = null;
const mockRun = jest.fn();
const mockConnect = jest.fn();

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({ fingerprint: "manual-1" }),
}));
jest.mock("../../lib/api", () => ({ useApi: () => mockApi }));
jest.mock("../../lib/useSessions", () => ({
  useSessions: () => ({ save: jest.fn(), remove: mockRemove }),
}));
jest.mock("../../components/Sheet", () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? children : null,
}));
jest.mock("./SessionTags", () => ({ SessionTags: () => null }));
jest.mock("../settings/useStravaConnect", () => ({
  useStravaConnect: () => ({ connect: mockConnect, busy: false, error: null }),
}));
jest.mock("../journal/SessionJournal", () => ({
  SessionJournal: ({ onAdd }: { onAdd: () => void }) => {
    const { Pressable, Text } = jest.requireActual<typeof ReactNative>("react-native");
    return (
      <Pressable onPress={onAdd}>
        <Text>Add a note</Text>
      </Pressable>
    );
  },
}));
jest.mock("@react-native-community/datetimepicker", () => ({
  __esModule: true,
  default: () => null,
  DateTimePickerAndroid: { open: jest.fn() },
}));
jest.mock("@sendtally/features/session-detail", () => ({
  ...jest.requireActual<object>("@sendtally/features/session-detail"),
  useSessionDetail: () => ({
    state: mockState,
    filter: "all",
    setFilter: jest.fn(),
    sort: "order",
    setSort: jest.fn(),
    post: { busy: false, error: null, run: mockRun, refresh: jest.fn() },
    reload: mockReload,
  }),
}));

const ready = (): unknown => ({
  status: "ready",
  data: {
    vm: {
      name: "Tuesday night session",
      place: "The Depot",
      when: "Tue 21 Oct · 19:00 · 2h",
      rpe: 7,
      pyramid: [],
      editable: true,
      startDay: "2026-10-21",
      filterCounts: { all: 14, sent: 9, flash: 2, project: 5 },
    },
    climbs: [],
    rows: [
      {
        id: "p",
        gradeLabel: "V5",
        name: "The Prow",
        count: 1,
        meta: "Stanage Popular · 4 tries",
        pill: { kind: "project", label: "Project" },
        n: 1,
        rank: 5,
        tries: 4,
      },
      {
        id: null,
        gradeLabel: "V4",
        name: "Boulder",
        count: 2,
        meta: "5 tries",
        pill: { kind: "sent", label: "Sent" },
        colour: "blue",
        n: 2,
        rank: 4,
        tries: 5,
      },
      {
        id: "g",
        gradeLabel: "V2",
        name: "Green circuit laps",
        count: 1,
        meta: "3 laps · 2 clean",
        pill: null,
        endurance: { unit: "moves", target: 40, laps: [40, 40, 28] },
        n: 3,
        rank: 2,
        tries: 1,
      },
    ],
    tags: [],
    entries: [],
    notes: null,
    strava: mockStrava,
  },
});

beforeEach(() => {
  jest.clearAllMocks();
  mockStrava = null;
  mockState = ready();
});

describe("Climbing session detail", () => {
  it("keeps Back while it fails to load, and retries", async () => {
    mockState = { status: "error", message: "Network down" };
    await render(<SessionDetailScreen />);
    expect(screen.getByText("Back")).toBeTruthy();
    expect(screen.getByText("Could not load this session.")).toBeTruthy();
    expect(screen.getByText("Network down")).toBeTruthy();
    await fireEvent.press(screen.getByText("Try again"));
    expect(mockReload).toHaveBeenCalled();
  });

  it("introduces itself as climbing, then reads its climbs, effort and sends as tiles", async () => {
    await render(<SessionDetailScreen />);
    expect(screen.getByText("Climbing")).toBeTruthy();
    expect(screen.getByText("The Depot")).toBeTruthy();
    expect(screen.queryByText(/Indoor/)).toBeNull();
    expect(screen.getByText("Tuesday night session")).toBeTruthy();
    expect(screen.getByText("Tue 21 Oct · 19:00 · 2h")).toBeTruthy();
    for (const [value, label] of [
      ["14", "climbs"],
      ["7", "effort"],
      ["9", "sent"],
    ]) {
      expect(screen.getByText(value ?? "")).toBeTruthy();
      expect(screen.getByText(label ?? "")).toBeTruthy();
    }
    expect(screen.queryByText("On Strava")).toBeNull();
  });

  it("shows where it stands with Strava under the tiles", async () => {
    mockStrava = { kind: "posted", url: "https://www.strava.com/activities/9", postedAt: null };
    mockState = ready();
    await render(<SessionDetailScreen />);
    expect(screen.getByText("On Strava")).toBeTruthy();
  });

  it("retries a failed post from the menu and says why it failed", async () => {
    mockStrava = { kind: "failed", reason: "Rate limited" };
    mockState = ready();
    await render(<SessionDetailScreen />);
    expect(screen.getByText("Rate limited")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("More"));
    await fireEvent.press(screen.getByText("Try posting again"));
    expect(mockRun).toHaveBeenCalled();
  });

  it("connects Strava from the menu when it is not connected", async () => {
    mockStrava = { kind: "connect" };
    mockState = ready();
    await render(<SessionDetailScreen />);
    await fireEvent.press(screen.getByLabelText("More"));
    await fireEvent.press(screen.getByText("Connect Strava"));
    expect(mockConnect).toHaveBeenCalled();
  });

  it("lists its climbs as the log does, opening only a climb with a page", async () => {
    await render(<SessionDetailScreen />);
    expect(screen.queryByText("Order climbed")).toBeNull();
    expect(screen.getByText("Stanage Popular · 4 tries")).toBeTruthy();
    expect(screen.getByText("Project")).toBeTruthy();
    expect(screen.getByText("3 laps · 2 clean")).toBeTruthy();
    expect(screen.getAllByText(/28/).length).toBeGreaterThan(0);
    await fireEvent.press(screen.getByText("The Prow"));
    expect(router.push).toHaveBeenCalledWith({ pathname: "/climb/[id]", params: { id: "p" } });
    jest.mocked(router.push).mockClear();
    await fireEvent.press(screen.getByText("Boulder ×2"));
    expect(router.push).not.toHaveBeenCalled();
    expect(screen.getByLabelText("V4, Boulder ×2, 5 tries, Sent")).toBeTruthy();
  });

  it("writes a note in a sheet on the session's day, attached to the session", async () => {
    await render(<SessionDetailScreen />);
    await fireEvent.press(screen.getByText("Add a note"));
    await fireEvent.changeText(
      screen.getByPlaceholderText("What happened, what to try next"),
      "Cold and greasy"
    );
    await fireEvent.press(screen.getByText("Save"));
    expect(mockCreateEntry).toHaveBeenCalledWith({
      kind: "journal",
      occurred_at: "2026-10-21",
      body: "Cold and greasy",
      fingerprints: ["manual-1"],
    });
  });

  it("edits from the first row of the ··· menu, not the bar", async () => {
    await render(<SessionDetailScreen />);
    expect(screen.queryByText("Edit")).toBeNull();
    await fireEvent.press(screen.getByLabelText("More"));
    await fireEvent.press(screen.getByText("Edit session"));
    expect(router.push).toHaveBeenCalledWith("/session/manual-1/edit");
  });

  it("views a posted session on Strava from the menu, and says the activity stays there", async () => {
    mockStrava = { kind: "posted", url: "https://www.strava.com/activities/9", postedAt: null };
    mockState = ready();
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await render(<SessionDetailScreen />);
    await fireEvent.press(screen.getByLabelText("More"));
    await fireEvent.press(screen.getByText("View on Strava"));
    expect(open).toHaveBeenCalledWith("https://www.strava.com/activities/9");
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    await fireEvent.press(screen.getByLabelText("More"));
    await fireEvent.press(screen.getByText("Delete session"));
    expect(alert.mock.calls[0]?.[1]).toBe("Removes it here; the Strava activity stays");
    alert.mockRestore();
  });

  it("deletes only once confirmed, then goes back", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    await render(<SessionDetailScreen />);
    await fireEvent.press(screen.getByLabelText("More"));
    await fireEvent.press(screen.getByText("Delete session"));
    expect(alert.mock.calls[0]?.[0]).toBe("Delete session?");
    expect(mockRemove).not.toHaveBeenCalled();
    const buttons = (alert.mock.calls[0]?.[2] ?? []) as AlertButton[];
    await act(async () => buttons.find((b) => b.style === "destructive")?.onPress?.());
    expect(mockRemove).toHaveBeenCalledWith("manual-1");
    expect(router.back).toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
    alert.mockRestore();
  });
});
