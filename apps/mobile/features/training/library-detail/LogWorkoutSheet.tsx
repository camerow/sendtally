import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { focusLabel, workoutLines } from "@sendtally/features/training";
import { libraryShelves } from "@sendtally/features/workouts";
import { DashedPanel } from "../components/DashedPanel";
import { Label } from "../components/Label";
import { SheetHeader } from "../components/SheetHeader";
import { HangDataProvider } from "../data/HangDataProvider";
import { useHangData } from "../data/HangDataContext";
import { HangSheet } from "../data/HangSheet";
import { LibrarySearch } from "../library/LibrarySearch";
import { useLibrary } from "../library/useLibrary";
import { LogWorkoutRow } from "./LogWorkoutRow";

export type LogWorkoutSheetProps = { visible: boolean; onClose: () => void };

function Picker({ visible, onClose }: LogWorkoutSheetProps): React.ReactElement {
  const { model, today } = useHangData();
  const { state } = useLibrary();
  const [text, setText] = React.useState("");
  const library = state.status === "ready" ? state.data : null;
  const shelves = library === null ? [] : libraryShelves(library.workouts, library.usage, { text });
  const close = (): void => {
    setText("");
    onClose();
  };
  return (
    <HangSheet visible={visible} onClose={close} closeLabel={t("common.cancel")}>
      <View style={{ gap: 12, paddingBottom: 12 }}>
        <SheetHeader
          kicker={t("statistics.training")}
          title={t("training.logWorkout")}
          action={t("common.cancel")}
          onAction={close}
        />
        <LibrarySearch value={text} onChange={setText} />
        {library !== null && shelves.length === 0 && (
          <DashedPanel title={t("workouts.noResultsTitle")} body={t("workouts.noResults")} />
        )}
        {shelves.map((shelf) => (
          <View key={shelf.focus ?? "general"} style={{ gap: 2 }}>
            <Label color={colors.textSecondary}>{focusLabel(shelf.focus)}</Label>
            {shelf.workouts.map((w) => (
              <LogWorkoutRow
                key={w.id}
                workout={w}
                dose={workoutLines(w, model)[0] ?? null}
                date={today}
                onLogged={close}
              />
            ))}
          </View>
        ))}
      </View>
    </HangSheet>
  );
}

/** Log a workout from the empty log: every workout under its focus, each opening Log it. */
export function LogWorkoutSheet({ visible, onClose }: LogWorkoutSheetProps): React.ReactElement {
  const [opened, setOpened] = React.useState(visible);
  if (visible && !opened) setOpened(true);
  return (
    <>
      {opened && (
        <HangDataProvider fallback={null}>
          <Picker visible={visible} onClose={onClose} />
        </HangDataProvider>
      )}
    </>
  );
}
