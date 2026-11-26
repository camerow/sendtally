import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import {
  measureLabel,
  sourceAbout,
  sourcePictures,
  type PickerEntry,
} from "@sendtally/features/exercises";
import { gripMeta } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Lock } from "../../../components/Lock";
import { pressRow } from "../../../lib/press";
import { AboutButton } from "../components/AboutButton";
import { CheckBox } from "../components/CheckBox";
import { holdProps } from "../components/holdProps";
import { IconButton } from "../components/IconButton";
import { KindTile } from "../components/KindTile";
import type { LongPress } from "../components/types";
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
  /** Members only: the name muted, with the lock. */
  locked?: boolean;
  hold?: LongPress;
};

function metaOf(entry: PickerEntry, { model, today }: HangData): string {
  if ("grip" in entry.source)
    return gripMeta(model.sessions, entry.source.grip.id, today, model.settings.units, true);
  if (entry.library) return t("workouts.fromLibrary");
  if (!("exercise" in entry.source)) return "";
  const { measure, kind } = entry.source.exercise;
  return measureLabel(measure, kind);
}

/** One exercise the picker offers: what it measures, and whether the workout already has it. */
export function PickerRow({
  entry,
  ticked,
  multi,
  mine = false,
  onPress,
  onEdit,
  locked = false,
  hold,
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
        accessibilityLabel={locked ? t("common.membersOnly", { label: entry.name }) : entry.name}
        {...holdProps(hold)}
        style={pressRow({
          flex: 1,
          minHeight: 56,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        })}
      >
        {multi && <CheckBox checked={ticked} color={colors.gunmetal} />}
        <KindTile kind={entry.kind} picture={sourcePictures(entry.source)[0]} />
        <View style={{ flex: 1, gap: 2, paddingVertical: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text
              style={[
                type.bodyBold,
                { flexShrink: 1, fontSize: 15, color: locked ? colors.textMuted : colors.gunmetal },
              ]}
            >
              {entry.name}
            </Text>
            {mine && <MineBadge />}
          </View>
          {meta !== "" && (
            <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>{meta}</Text>
          )}
        </View>
        {entry.inWorkout && <Label color={colors.textSecondary}>{t("workouts.inWorkout")}</Label>}
        {locked && <Lock />}
      </Pressable>
      <AboutButton
        about={sourceAbout(entry)}
        label={t("workouts.aboutExercise")}
        color={colors.textMuted}
      />
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
