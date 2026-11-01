import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import type { LibraryWorkout } from "@sendtally/features/workouts";
import { Icon } from "../../../components/Icon";
import { press, pressRow } from "../../../lib/press";
import { CategoryMark } from "../library/CategoryMark";
import { KIND_LOOK } from "../today/kindLook";
import { type } from "../type";

/** Where the workout stands: addable, just added here, or already there. */
export type AddState = "none" | "added" | "there";

export type AddWorkoutRowProps = {
  workout: LibraryWorkout;
  /** What it holds in a line, such as "3 × 8" or "20m". */
  dose: string | null;
  state: AddState;
  /** "In block", or the day's word for a plan already on it. */
  thereLabel: string;
  onOpen: () => void;
  /** Adds it, or takes back what was just added. */
  onToggle: () => void;
};

/** A workout to add: its kind's tile, name and dose, opening its preview, with + to add it. */
export function AddWorkoutRow({
  workout,
  dose,
  state,
  thereLabel,
  onOpen,
  onToggle,
}: AddWorkoutRowProps): React.ReactElement {
  const look = KIND_LOOK[workout.kind];
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 }}>
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={workout.name}
        style={pressRow({
          flex: 1,
          minWidth: 0,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        })}
      >
        <CategoryMark kind={workout.kind} size={36} />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text numberOfLines={1} style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>
            {workout.name}
          </Text>
          <Text
            numberOfLines={1}
            style={[type.mono, { fontSize: 11.5, color: colors.textSecondary }]}
          >
            <Text style={{ color: look.ink, textTransform: "uppercase" }}>
              {kindLabel(workout.kind)}
            </Text>
            {dose !== null && ` · ${dose}`}
          </Text>
        </View>
      </Pressable>
      {state === "there" ? (
        <Text style={[type.mono, { fontSize: 12, color: colors.textMuted }]}>{thereLabel}</Text>
      ) : state === "added" ? (
        <Pressable
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel={t("plan.undoAdd", { name: workout.name })}
          hitSlop={6}
          style={press({
            height: 36,
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 12,
            borderRadius: 18,
            backgroundColor: colors.fern,
          })}
        >
          <Icon name="check" color={colors.white} size={16} strokeWidth={2.5} />
          <Text style={[type.bodyBold, { fontSize: 14, color: colors.white }]}>
            {t("plan.added")}
          </Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel={t("plan.addNamed", { name: workout.name })}
          hitSlop={6}
          style={press({
            width: 36,
            height: 36,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 18,
            backgroundColor: colors.gunmetal,
          })}
        >
          <Icon name="plus" color={colors.white} size={18} strokeWidth={2.5} />
        </Pressable>
      )}
    </View>
  );
}
