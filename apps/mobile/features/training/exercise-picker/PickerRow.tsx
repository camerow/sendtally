import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { measureLabel, type PickerEntry } from "@sendtally/features/exercises";
import { gripMeta } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { pressRow } from "../../../lib/press";
import { CheckBox } from "../components/CheckBox";
import { IconButton } from "../components/IconButton";
import { Label } from "../components/Label";
import { useHangData, type HangData } from "../data/HangDataContext";
import { MineBadge } from "../library/MineBadge";
import { type } from "../type";

export type PickerRowProps = {
  entry: PickerEntry;
  ticked: boolean;
  /** Ticks in a multi-select picker; picks at once otherwise. */
  multi: boolean;
  /** Badged as the user's own, where the list mixes in the starter library. */
  mine?: boolean;
  /** Left out where the row has nothing to open. */
  onPress?: () => void;
  /** A pencil beside the row, where it can be edited from the list. */
  onEdit?: () => void;
};

function metaOf(entry: PickerEntry, { model, today }: HangData): string {
  if ("grip" in entry.source)
    return gripMeta(model.sessions, entry.source.grip.id, today, model.settings.units, true);
  if (entry.uses > 0) return t("workouts.timesUsed", { count: entry.uses });
  if (entry.library) return t("workouts.fromLibrary");
  if (!("exercise" in entry.source)) return "";
  const { measure, kind } = entry.source.exercise;
  return measureLabel(measure, kind);
}

/** One exercise the picker offers: how often it was used, and whether the workout already has it. */
export function PickerRow({
  entry,
  ticked,
  multi,
  mine = false,
  onPress,
  onEdit,
}: PickerRowProps): React.ReactElement {
  const meta = metaOf(entry, useHangData());
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: colors.lineOnLightSoft,
      }}
    >
      <Pressable
        onPress={onPress}
        disabled={onPress === undefined}
        accessibilityRole={multi ? "checkbox" : "button"}
        accessibilityState={multi ? { checked: ticked } : undefined}
        accessibilityLabel={entry.name}
        style={pressRow({
          flex: 1,
          minHeight: 56,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        })}
      >
        {multi && <CheckBox checked={ticked} color={colors.gunmetal} />}
        <View style={{ flex: 1, gap: 2, paddingVertical: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={[type.bodyBold, { flexShrink: 1, fontSize: 15, color: colors.gunmetal }]}>
              {entry.name}
            </Text>
            {mine && <MineBadge />}
          </View>
          {meta !== "" && (
            <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>{meta}</Text>
          )}
        </View>
        {entry.inWorkout && <Label color={colors.textSecondary}>{t("workouts.inWorkout")}</Label>}
      </Pressable>
      {onEdit !== undefined && (
        <IconButton
          icon="edit"
          label={t("hang.editGripAria", { grip: entry.name })}
          onPress={onEdit}
          color={colors.textSecondary}
          iconSize={18}
        />
      )}
    </View>
  );
}
