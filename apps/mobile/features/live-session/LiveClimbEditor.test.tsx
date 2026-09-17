import { describe, expect, it, jest } from "@jest/globals";
import React from "react";
import { Pressable, Text } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import type { ClimbVocabulary } from "@sendtally/features/climbs";
import type * as LogSession from "@sendtally/features/log-session";
import {
  DEFAULT_GRADE_PREFS,
  draftStorage,
  useLiveSession,
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
jest.mock("../../components/Sheet", () => ({
  Sheet: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
    visible ? children : null,
}));

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

function QuickLog({ storage }: { storage: DraftStorage }): React.ReactElement {
  const live = useLiveSession(storage);
  const [editing, setEditing] = React.useState<string | null>(null);
  return (
    <>
      {live.stored !== null && (
        <LiveSessionCard
          stored={live.stored}
          vocabulary={vocabulary}
          gym={null}
          onEditClimb={setEditing}
          onChangeTries={() => {}}
        />
      )}
      <Pressable
        accessibilityRole="button"
        onPress={() => setEditing(live.addClimb(DEFAULT_GRADE_PREFS, [], "boulder"))}
      >
        <Text>Climb</Text>
      </Pressable>
      <LiveClimbEditor
        live={live}
        vocabulary={vocabulary}
        gyms={[]}
        editingKey={editing}
        onClose={() => setEditing(null)}
      />
    </>
  );
}

describe("logging a climb from the Log tab", () => {
  it("starts a live session, adds to it, and removing the last climb ends it", async () => {
    await render(<QuickLog storage={memoryStorage()} />);

    await fireEvent.press(screen.getByText("Climb"));
    expect(screen.getByText("Climb 1 of 1")).toBeOnTheScreen();
    await fireEvent.press(screen.getByText("Save"));
    expect(screen.queryByText("Climb 1 of 1")).not.toBeOnTheScreen();
    expect(
      screen.getByLabelText(/(Morning|Afternoon|Evening) session, .*In progress for/)
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByText("Climb"));
    expect(screen.getByText("Climb 2 of 2")).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByPlaceholderText("Name (optional)"), "Maestro Arete");
    await fireEvent.press(screen.getByText("Save"));
    expect(screen.getByText(/Maestro Arete/)).toBeOnTheScreen();

    await fireEvent.press(screen.getByText(/Maestro Arete/));
    expect(screen.getByText("Climb 2 of 2")).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText("Remove climb"));
    expect(screen.queryByText(/Maestro Arete/)).not.toBeOnTheScreen();
    expect(screen.getByLabelText(/In progress for/)).toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText(/^V3 Unnamed/));
    expect(screen.getByText("Climb 1 of 1")).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText("Remove climb"));
    expect(screen.queryByLabelText(/In progress for/)).not.toBeOnTheScreen();
  });
});
