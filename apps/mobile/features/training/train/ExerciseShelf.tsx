import React from "react";
import { Text, View } from "react-native";
import type { WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { CategoryRow } from "../components/CategoryRow";
import { ShelfHeader } from "../components/ShelfHeader";
import { SHELF_ROWS } from "../library/LibraryShelf";
import { type } from "../type";
import type { ShelfCard } from "./types";

export type ExerciseShelfProps = {
  kind: WorkoutKind;
  cards: readonly ShelfCard[];
  onAdd: () => void;
  onSeeAll: () => void;
};

/** One category: its heading and plus, then its first exercises, done ones first, or a hint when it has none. */
export function ExerciseShelf({
  kind,
  cards,
  onAdd,
  onSeeAll,
}: ExerciseShelfProps): React.ReactElement {
  const label = kindLabel(kind);
  return (
    <View style={{ gap: 2 }}>
      <ShelfHeader
        title={label}
        kind={kind}
        onSeeAll={cards.length > SHELF_ROWS ? onSeeAll : undefined}
        count={cards.length}
        addLabel={t("workouts.newExerciseIn", { category: label })}
        onAdd={onAdd}
      />
      {cards.length === 0 ? (
        <View
          style={{
            minHeight: 72,
            marginTop: 8,
            padding: 14,
            borderRadius: 16,
            justifyContent: "center",
            borderWidth: 1.5,
            borderStyle: "dashed",
            borderColor: "rgba(64,63,76,0.24)",
          }}
        >
          <Text style={[type.body, { fontSize: 14, lineHeight: 20, color: colors.textSecondary }]}>
            {t(`workouts.categoryEmpty.${kind}`)}
          </Text>
        </View>
      ) : (
        [...cards]
          .sort((a, b) => Number(a.meta === null) - Number(b.meta === null))
          .slice(0, SHELF_ROWS)
          .map((c) => (
            <CategoryRow
              key={c.key}
              kind={kind}
              name={c.name}
              meta={c.meta ?? t("workouts.notDoneYet")}
              faded={c.meta === null}
              showKind={false}
              showMark={false}
              onPress={c.open}
            />
          ))
      )}
    </View>
  );
}
