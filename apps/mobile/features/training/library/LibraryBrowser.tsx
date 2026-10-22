import React from "react";
import { View } from "react-native";
import type { WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import {
  browseLibrary,
  type LibraryWorkout,
  type WorkoutLibrary,
} from "@sendtally/features/workouts";
import { DashedPanel } from "../components/DashedPanel";
import { Label } from "../components/Label";
import { LibraryCard } from "./LibraryCard";
import { LibrarySearch } from "./LibrarySearch";

export type LibraryBrowserProps = {
  library: WorkoutLibrary;
  /** The kinds it offers; all of them by default. */
  kinds?: readonly WorkoutKind[];
  inSheet?: boolean;
  onPick: (workout: LibraryWorkout) => void;
};

/** Search the library: the user's own by last use, then the built-ins, as a plain column of cards. */
export function LibraryBrowser({
  library,
  kinds,
  inSheet = false,
  onPick,
}: LibraryBrowserProps): React.ReactElement {
  const [text, setText] = React.useState("");
  const { mine, builtIn } = browseLibrary(library.workouts, { text, kinds }, library.usage);
  const card = (w: LibraryWorkout): React.ReactElement => (
    <LibraryCard key={w.id} workout={w} use={library.usage.get(w.id)} onPress={() => onPick(w)} />
  );

  return (
    <View style={{ gap: 12 }}>
      <LibrarySearch value={text} inSheet={inSheet} onChange={setText} />
      {mine.length === 0 && builtIn.length === 0 && (
        <DashedPanel title={t("workouts.noResultsTitle")} body={t("workouts.noResults")} />
      )}
      {mine.length > 0 && <Label color={colors.textSecondary}>{t("workouts.mine")}</Label>}
      {mine.map(card)}
      {builtIn.length > 0 && <Label color={colors.textSecondary}>{t("workouts.builtIn")}</Label>}
      {builtIn.map(card)}
    </View>
  );
}
