import React from "react";
import { View } from "react-native";
import { t } from "@sendtally/features/i18n";
import type { LibraryWorkout, WorkoutCategory } from "@sendtally/features/workouts";
import { SheetHeader } from "../components/SheetHeader";
import { HangDataProvider } from "../data/HangDataProvider";
import { HangSheet } from "../data/HangSheet";
import { LoadState } from "../data/LoadState";
import { LibraryBrowser } from "./LibraryBrowser";
import { useLibrary } from "./useLibrary";

export type LibraryPickerSheetProps = {
  title: string;
  /** The categories it offers; all of them by default. */
  categories?: readonly WorkoutCategory[];
  /** Closes with the pick, or null, once slid away. */
  onClose: (workout: LibraryWorkout | null) => void;
};

function Picker({ title, categories, onClose }: LibraryPickerSheetProps): React.ReactElement {
  const { state, reload } = useLibrary();
  const [open, setOpen] = React.useState(true);
  const picked = React.useRef<LibraryWorkout | null>(null);
  return (
    <HangSheet visible={open} onClose={() => onClose(picked.current)} closeLabel={t("plan.close")}>
      <View style={{ gap: 14, paddingBottom: 12 }}>
        <SheetHeader
          kicker={t("workouts.library")}
          title={title}
          action={t("hang.cancel")}
          onAction={() => setOpen(false)}
        />
        {state.status === "ready" ? (
          <LibraryBrowser
            library={state.data}
            categories={categories}
            inSheet
            onPick={(w) => {
              picked.current = w;
              setOpen(false);
            }}
          />
        ) : (
          <LoadState state={state} onRetry={() => void reload()} />
        )}
      </View>
    </HangSheet>
  );
}

/** The library in a sheet, with the same search, filters and sort, to pick a workout from. */
export function LibraryPickerSheet(props: LibraryPickerSheetProps): React.ReactElement {
  return (
    <HangDataProvider fallback={null}>
      <Picker {...props} />
    </HangDataProvider>
  );
}
