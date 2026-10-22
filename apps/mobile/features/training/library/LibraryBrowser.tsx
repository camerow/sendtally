import React from "react";
import { Pressable, View } from "react-native";
import type { WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import {
  browseLibrary,
  type LibraryWorkout,
  type WorkoutLibrary,
} from "@sendtally/features/workouts";
import { press } from "../../../lib/press";
import { DashedPanel } from "../components/DashedPanel";
import { HangIcon } from "../components/HangIcon";
import { Label } from "../components/Label";
import { LibraryCard } from "./LibraryCard";
import { LibrarySearch } from "./LibrarySearch";

export type LibraryBrowserProps = {
  library: WorkoutLibrary;
  /** The kinds it offers; all of them by default. */
  kinds?: readonly WorkoutKind[];
  onPick: (workout: LibraryWorkout) => void;
};

/**
 * Search the library: the user's own first by last use, and the built-ins folded below
 * behind one row, open while a search is typed.
 */
export function LibraryBrowser({
  library,
  kinds,
  onPick,
}: LibraryBrowserProps): React.ReactElement {
  const [text, setText] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const { mine, builtIn } = browseLibrary(library.workouts, { text, kinds }, library.usage);
  const shown = open || text.trim() !== "";
  const card = (w: LibraryWorkout): React.ReactElement => (
    <LibraryCard key={w.id} workout={w} use={library.usage.get(w.id)} onPress={() => onPick(w)} />
  );

  return (
    <View style={{ gap: 12 }}>
      <LibrarySearch value={text} onChange={setText} />
      {mine.length === 0 && builtIn.length === 0 && (
        <DashedPanel title={t("workouts.noResultsTitle")} body={t("workouts.noResults")} />
      )}
      {mine.length > 0 && <Label color={colors.textSecondary}>{t("workouts.mine")}</Label>}
      {mine.map(card)}
      {builtIn.length > 0 && (
        <Pressable
          onPress={() => setOpen(!open)}
          accessibilityRole="button"
          accessibilityState={{ expanded: shown }}
          style={press({
            minHeight: 44,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          })}
        >
          <Label color={colors.textSecondary}>
            {t("workouts.builtInCount", { n: builtIn.length })}
          </Label>
          <HangIcon
            name={shown ? "up" : "down"}
            color={colors.textSecondary}
            size={16}
            strokeWidth={2.2}
          />
        </Pressable>
      )}
      {shown && builtIn.map(card)}
    </View>
  );
}
