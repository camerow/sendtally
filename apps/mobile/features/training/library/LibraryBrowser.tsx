import React from "react";
import { View } from "react-native";
import type { WorkoutKind } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import {
  browseLibrary,
  type LibraryWorkout,
  type WorkoutLibrary,
} from "@sendtally/features/workouts";
import { DashedPanel } from "../components/DashedPanel";
import { LibraryCard } from "./LibraryCard";
import { LibrarySearch } from "./LibrarySearch";

export type LibraryBrowserProps = {
  library: WorkoutLibrary;
  /** The kinds it offers; all of them by default. */
  kinds?: readonly WorkoutKind[];
  onPick: (workout: LibraryWorkout) => void;
  /** Shown in place of the list until a search is typed. */
  children?: React.ReactNode;
};

/** Search the library and list what it finds in one column, the user's own first by last use. */
export function LibraryBrowser({
  library,
  kinds,
  onPick,
  children,
}: LibraryBrowserProps): React.ReactElement {
  const [text, setText] = React.useState("");
  const browsing = children !== undefined && text.trim() === "";
  const found = browsing ? [] : browseLibrary(library.workouts, { text, kinds }, library.usage);
  return (
    <View style={{ gap: 12 }}>
      <LibrarySearch value={text} onChange={setText} />
      {browsing && children}
      {!browsing && found.length === 0 && (
        <DashedPanel title={t("workouts.noResultsTitle")} body={t("workouts.noResults")} />
      )}
      {found.map((w) => (
        <LibraryCard
          key={w.id}
          workout={w}
          use={library.usage.get(w.id)}
          showKind={kinds?.length !== 1}
          onPress={() => onPick(w)}
        />
      ))}
    </View>
  );
}
