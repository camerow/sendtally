import React from "react";
import { View } from "react-native";
import { t } from "@sendtally/features/i18n";
import {
  browseLibrary,
  DEFAULT_FILTER,
  isFiltered,
  WORKOUT_CATEGORIES,
  type LibraryFilter,
  type LibrarySource,
  type LibraryWorkout,
  type WorkoutCategory,
  type WorkoutLibrary,
} from "@sendtally/features/workouts";
import { Button } from "../components/Button";
import { DashedPanel } from "../components/DashedPanel";
import { Segmented } from "../components/Segmented";
import { CategoryChips } from "./CategoryChips";
import { LibraryCard } from "./LibraryCard";
import { LibrarySearch } from "./LibrarySearch";
import { SortChips } from "./SortChips";

export type LibraryBrowserProps = {
  library: WorkoutLibrary;
  /** The categories it offers; all of them by default. */
  categories?: readonly WorkoutCategory[];
  inSheet?: boolean;
  onPick: (workout: LibraryWorkout) => void;
};

/** Search, filter and sort the library, as a plain column of cards for the host's scroll view. */
export function LibraryBrowser({
  library,
  categories = WORKOUT_CATEGORIES,
  inSheet = false,
  onPick,
}: LibraryBrowserProps): React.ReactElement {
  const [filter, setFilter] = React.useState<LibraryFilter>(DEFAULT_FILTER);
  const update = (patch: Partial<LibraryFilter>): void => setFilter((f) => ({ ...f, ...patch }));
  const offered = library.workouts.filter((w) => categories.includes(w.category));
  const shown = browseLibrary(offered, filter, library.usage);
  const mineOnly = filter.source === "mine" && !isFiltered({ ...filter, source: "all" });

  return (
    <View style={{ gap: 12 }}>
      <LibrarySearch value={filter.text} inSheet={inSheet} onChange={(text) => update({ text })} />
      {categories.length > 1 && (
        <CategoryChips
          offered={categories}
          value={filter.categories}
          onChange={(c) => update({ categories: c })}
        />
      )}
      <Segmented<LibrarySource | "all">
        value={filter.source}
        onChange={(source) => update({ source })}
        options={[
          { value: "all", label: t("workouts.all") },
          { value: "library", label: t("workouts.builtIn") },
          { value: "mine", label: t("workouts.mine") },
        ]}
      />
      <SortChips value={filter.sort} onChange={(sort) => update({ sort })} />
      {shown.length === 0 &&
        (mineOnly ? (
          <DashedPanel body={t("workouts.noMine")} />
        ) : (
          <View style={{ gap: 8 }}>
            <DashedPanel title={t("workouts.noResultsTitle")} body={t("workouts.noResults")} />
            <Button
              label={t("workouts.clearFilters")}
              onPress={() => setFilter({ ...DEFAULT_FILTER, sort: filter.sort })}
              variant="link"
              height={44}
            />
          </View>
        ))}
      {shown.map((w) => (
        <LibraryCard
          key={w.id}
          workout={w}
          use={library.usage.get(w.id)}
          onPress={() => onPick(w)}
        />
      ))}
    </View>
  );
}
