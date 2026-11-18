import React from "react";
import { Pressable, Text, View } from "react-native";
import { clock, type SessionItem } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { exerciseName, exerciseTargetLine } from "@sendtally/features/workouts";
import { Icon } from "../../../components/Icon";
import { press } from "../../../lib/press";
import { AboutButton, type About } from "../components/AboutButton";
import { DetailMenu } from "../components/DetailMenu";
import type { DetailMenuRow } from "../components/types";
import { LetterBadge } from "../components/LetterBadge";
import { type } from "../type";

export type ExerciseCardHeadProps = {
  item: SessionItem;
  /** The exercise's description behind an info button beside its name; none without one. */
  about?: About | undefined;
  /** Its title folds it. */
  onFold: () => void;
  /** Its ··· menu: skip, move, remove. */
  menu: readonly DetailMenuRow[];
};

/** An open exercise card's head: its name to fold it, its letter, rest, menu and target effort. */
export function ExerciseCardHead({
  item,
  about,
  onFold,
  menu,
}: ExerciseCardHeadProps): React.ReactElement {
  const name = exerciseName(item.exercise);
  const { name: doseName, setRestS, targetRpe } = item.dose;
  const rated = targetRpe !== undefined;
  return (
    <View style={{ gap: 2, paddingBottom: 4 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Pressable
            onPress={onFold}
            accessibilityRole="button"
            accessibilityLabel={t("workouts.foldExercise", { name })}
            accessibilityState={{ expanded: true }}
            hitSlop={{ top: 12, bottom: 12 }}
            style={press({
              flexShrink: 1,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            })}
          >
            <Text style={[type.bodyBold, { flexShrink: 1, fontSize: 17, color: colors.gunmetal }]}>
              {name}
            </Text>
            <View style={{ transform: [{ rotate: "-90deg" }] }}>
              <Icon name="chevron" size={16} strokeWidth={2} color={colors.textMuted} />
            </View>
          </Pressable>
          <AboutButton about={about} label={t("workouts.aboutExercise")} color={colors.textMuted} />
        </View>
        {item.turn !== undefined && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center" }}>
            <LetterBadge dose={item.turn} size={22} />
            {doseName !== undefined && (
              <Text style={[type.body, { fontSize: 13, color: colors.textSecondary }]}>
                {doseName}
              </Text>
            )}
          </View>
        )}
        {setRestS !== undefined && setRestS > 0 && (
          <Text style={[type.body, { fontSize: 13, color: colors.textSecondary }]}>
            {t("plan.chipRest", { value: clock(setRestS) })}
          </Text>
        )}
        <View style={{ alignSelf: "center", marginVertical: -8 }}>
          <DetailMenu
            rows={menu}
            button={{
              label: t("workouts.exerciseMore"),
              color: colors.textSecondary,
              size: 36,
              iconSize: 20,
            }}
          />
        </View>
      </View>
      {rated && (
        <Text style={[type.body, { fontSize: 13, color: colors.textSecondary }]}>
          {exerciseTargetLine(item.dose)}
        </Text>
      )}
    </View>
  );
}
