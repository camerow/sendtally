import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import type { LibraryPicture, WorkoutKind } from "@sendtally/core/hang";
import { AddButton } from "../../../components/AddButton";
import { Icon } from "../../../components/Icon";
import { press } from "../../../lib/press";
import { CategoryRow } from "../components/CategoryRow";
import { type } from "../type";

/** Where it stands: addable, just added here, or already there. */
export type AddState = "none" | "added" | "there";

export type AddWorkoutRowProps = {
  kind: WorkoutKind;
  name: string;
  /** What it holds in a line, such as "3 × 8" or "In 2 workouts". */
  meta: string | null;
  /** The built-in's first picture, as its tile. */
  picture?: LibraryPicture;
  state: AddState;
  /** "In block", or the day's word for a plan already on it. */
  thereLabel: string;
  onOpen: () => void;
  /** Adds it, or takes back what was just added. */
  onToggle: () => void;
  /** Beside the name, such as the Yours tag. */
  tag?: React.ReactNode;
  /** Members only: muted with the lock, its + the lock too. */
  locked?: boolean;
};

/** A workout or exercise to add: its kind's tile, name and meta, opening it, with + to add it. */
export function AddWorkoutRow({
  kind,
  name,
  meta,
  picture,
  state,
  thereLabel,
  onOpen,
  onToggle,
  tag,
  locked = false,
}: AddWorkoutRowProps): React.ReactElement {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <CategoryRow
          kind={kind}
          name={name}
          meta={meta}
          picture={picture}
          onPress={onOpen}
          tag={tag}
          locked={locked}
        />
      </View>
      {state === "there" ? (
        <Text style={[type.mono, { fontSize: 12, color: colors.textMuted }]}>{thereLabel}</Text>
      ) : state === "added" ? (
        <Pressable
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel={t("plan.undoAdd", { name })}
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
        <AddButton label={t("plan.addNamed", { name })} onPress={onToggle} locked={locked} />
      )}
    </View>
  );
}
