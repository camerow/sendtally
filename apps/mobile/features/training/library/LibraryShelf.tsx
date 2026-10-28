import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { focusLabel } from "@sendtally/features/training";
import type {
  LibraryShelf as Shelf,
  LibraryWorkout,
  WorkoutUse,
} from "@sendtally/features/workouts";
import { press } from "../../../lib/press";
import { HangIcon } from "../components/HangIcon";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { LibraryCard } from "./LibraryCard";

export type LibraryShelfProps = {
  shelf: Shelf;
  usage: ReadonlyMap<string, WorkoutUse>;
  onPick: (workout: LibraryWorkout) => void;
  onSeeAll: () => void;
  /** The host column's side padding, which the row bleeds through to the screen's edges. */
  gutter: number;
};

/** One focus: its name, which opens all of it, over a sideways row of its workouts. */
export function LibraryShelf({
  shelf,
  usage,
  onPick,
  onSeeAll,
  gutter,
}: LibraryShelfProps): React.ReactElement {
  return (
    <View style={{ gap: 10 }}>
      <Pressable
        onPress={onSeeAll}
        accessibilityRole="button"
        accessibilityLabel={t("workouts.seeAllOf", { kind: focusLabel(shelf.focus) })}
        style={press({ minHeight: 44, flexDirection: "row", alignItems: "center", gap: 10 })}
      >
        <Title
          size={26}
          style={{ flex: 1, ...(shelf.focus === null && { color: colors.textMuted }) }}
        >
          {focusLabel(shelf.focus)}
        </Title>
        <Label color={colors.textSecondary}>{t("workouts.seeAll")}</Label>
        <HangIcon name="forward" color={colors.textSecondary} size={16} strokeWidth={2.2} />
      </Pressable>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -gutter }}
        contentContainerStyle={{ gap: 12, paddingHorizontal: gutter }}
      >
        {shelf.workouts.map((w) => (
          <LibraryCard
            key={w.id}
            workout={w}
            use={usage.get(w.id)}
            width={264}
            onPress={() => onPick(w)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
