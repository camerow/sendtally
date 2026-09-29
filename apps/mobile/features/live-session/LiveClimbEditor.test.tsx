import { afterEach, describe, expect, it, jest } from "@jest/globals";
import React from "react";
import { Alert, Pressable, Text } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ClimbVocabulary } from "@sendtally/features/climbs";
import type * as LogSession from "@sendtally/features/log-session";
import {
  DEFAULT_GRADE_PREFS,
  draftStorage,
  useClimbEditor,
  useLiveSession,
  type DayClimbApi,
  type DraftStorage,
} from "@sendtally/features/log-session";
import { LiveClimbEditor } from "./LiveClimbEditor";
import { LiveSessionCard } from "./LiveSessionCard";

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("../../lib/api", () => ({ useApi: () => null }));
jest.mock("@sendtally/features/settings", () => ({
  useGradeScalePrefs: () => ({
    scales: jest.requireActual<typeof LogSession>("@sendtally/features/log-session")
      .DEFAULT_GRADE_PREFS,
    ready: true,
  }),
}));
// Like the real sheet, dismissing calls the onClose it held while open, not the latest one.
jest.mock("../../components/Sheet", () => {
  const { useEffect, useRef } = jest.requireActual<typeof React>("react");
  return {
    Sheet: function Sheet({
      visible,
      children,
      footer,
      onClose,
    }: {
      visible: boolean;
      children: React.ReactNode;
      footer?: React.ReactNode;
      onClose: () => void;
    }) {
      const shown = useRef(visible);
      const closeWhileShown = useRef(onClose);
      useEffect(() => {
        if (shown.current && !visible) closeWhileShown.current();
        if (visible) closeWhileShown.current = onClose;
        shown.current = visible;
      });
      return visible ? [children, footer] : null;
    },
  };
});

jest.spyOn(Alert, "alert").mockImplementation((_title, _body, buttons) => {
  buttons?.find((b) => b.style === "destructive")?.onPress?.();
});

const vocabulary: ClimbVocabulary = {
  climbs: [],
  isProject: () => false,
  suggestionsFor: () => [],
} as unknown as ClimbVocabulary;

function memoryStorage(): DraftStorage {
  let value: string | null = null;
  return draftStorage({
    read: () => value,
    write: (next) => {
      value = next;
    },
    remove: () => {
      value = null;
    },
  });
}

function QuickLog({
  storage,
  api = {} as DayClimbApi,
}: {
  storage: DraftStorage;
  api?: DayClimbApi;
}): React.ReactElement {
  const live = useLiveSession(storage);
  const editor = useClimbEditor(live, api, []);
  return (
    <>
      {live.stored !== null && (
        <LiveSessionCard
          stored={live.stored}
          status="idle"
          onToggleSent={() => {}}
          vocabulary={vocabulary}
          gym={null}
          onEditClimb={editor.open}
          onChangeTries={() => {}}
          onSent={() => {}}
          onAddLap={() => {}}
        />
      )}
      <Pressable
        accessibilityRole="button"
        onPress={() => editor.openNew(DEFAULT_GRADE_PREFS, "boulder")}
      >
        <Text>Climb</Text>
      </Pressable>
      <LiveClimbEditor editor={editor} vocabulary={vocabulary} gyms={[]} />
    </>
  );
}

const queryClient = new QueryClient();

afterEach(() => queryClient.clear());

describe("logging a climb from the Log tab", () => {
  it("starts a live session, adds to it, and removing the last climb ends it", async () => {
    await render(
      <QueryClientProvider client={queryClient}>
        <QuickLog storage={memoryStorage()} />
      </QueryClientProvider>
    );

    await fireEvent.press(screen.getByText("Climb"));
    expect(screen.getByText("1 of 1")).toBeOnTheScreen();
    await fireEvent.press(screen.getByText("Save"));
    expect(screen.queryByText("1 of 1")).not.toBeOnTheScreen();
    expect(
      screen.getByLabelText(/(Morning|Afternoon|Evening) session, .*Saved as you go/)
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByText("Climb"));
    expect(screen.getByText("2 of 2")).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByPlaceholderText("Name (optional)"), "Maestro Arete");
    await fireEvent.press(screen.getByText("Save"));
    expect(screen.getByText(/Maestro Arete/)).toBeOnTheScreen();

    await fireEvent.press(screen.getByText(/Maestro Arete/));
    expect(screen.getByText("2 of 2")).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText("Remove climb"));
    expect(screen.queryByText(/Maestro Arete/)).not.toBeOnTheScreen();
    expect(screen.getByLabelText(/Saved as you go/)).toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText(/^V3 Unnamed/));
    expect(screen.getByText("1 of 1")).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText("Remove climb"));
    expect(screen.queryByLabelText(/In progress for/)).not.toBeOnTheScreen();
  });
});
