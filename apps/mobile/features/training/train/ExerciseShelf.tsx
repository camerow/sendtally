import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import type { WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { pressRow } from "../../../lib/press";
import { ShelfHeader } from "../components/ShelfHeader";
import { type } from "../type";
import type { ShelfCard } from "./types";

export type ExerciseShelfProps = {
  kind: WorkoutKind;
  cards: readonly ShelfCard[];
  onAdd: () => void;
  onSeeAll: () => void;
};

const card = {
  width: 184,
  minHeight: 96,
  padding: 14,
  gap: 8,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: colors.lineOnLight,
} as const;

/** One category: its heading and plus, then its exercises, or a hint when it has none. */
export function ExerciseShelf({
  kind,
  cards,
  onAdd,
  onSeeAll,
}: ExerciseShelfProps): React.ReactElement {
  const label = kindLabel(kind);
  return (
    <View style={{ gap: 10 }}>
      <ShelfHeader
        title={label}
        kind={kind}
        onSeeAll={cards.length === 0 ? undefined : onSeeAll}
        addLabel={t("workouts.newExerciseIn", { category: label })}
        onAdd={onAdd}
      />
      {cards.length === 0 ? (
        <View
          style={{
            ...card,
            width: undefined,
            minHeight: 72,
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -18 }}
          contentContainerStyle={{ gap: 12, paddingHorizontal: 18 }}
        >
          {cards.map((c) => (
            <Pressable
              key={c.key}
              onPress={c.open}
              disabled={c.open === undefined}
              accessibilityRole="button"
              style={pressRow(card)}
            >
              <Text style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>
                {c.name}
              </Text>
              <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
                {c.meta}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
