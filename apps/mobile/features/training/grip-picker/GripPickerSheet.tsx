import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import type { HangWorkout } from "@sendtally/core/hang";
import { gripMeta, setupLabel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { SheetHeader } from "../components/SheetHeader";
import { useHangData } from "../data/HangDataContext";
import { HangSheet } from "../data/HangSheet";
import { type } from "../type";
import { openGripEditor } from "../exercises/openExerciseEditor";
import { AddGrip } from "./AddGrip";
import { GripRow } from "./GripRow";

export type GripPickerSheetProps = {
  visible: boolean;
  workout: HangWorkout;
  multi: boolean;
  selected: readonly string[];
  onPick: (gripId: string) => void;
  onClose: () => void;
};

/**
 * Choose Fingers exercises (several, stays open) or one (closes on pick). A pencil opens the
 * exercise editor on any of them, built-ins too.
 */
export function GripPickerSheet({
  visible,
  workout,
  multi,
  selected,
  onPick,
  onClose,
}: GripPickerSheetProps): React.ReactElement | null {
  const { model, today } = useHangData();
  const unit = model.settings.units;
  const shown = model.grips.filter((g) => !g.hidden || selected.includes(g.id));

  const pick = (id: string): void => {
    onPick(id);
    if (!multi) onClose();
  };
  const choose = (id: string): void => {
    if (!multi || !selected.includes(id)) pick(id);
  };
  const edit = (id: string): void => {
    onClose();
    openGripEditor(id);
  };

  return (
    <HangSheet visible={visible} onClose={onClose} closeLabel={t("hang.closeGripPicker")}>
      <SheetHeader
        kicker={workout.name}
        title={multi ? t("hang.chooseGrips") : t("hang.chooseAGrip")}
        action={t("hang.done")}
        onAction={onClose}
      />
      {multi && (
        <Text
          style={[
            type.body,
            { fontSize: 14, lineHeight: 21, color: colors.textSecondary, paddingTop: 8 },
          ]}
        >
          {t("hang.gripPickerMulti")}
        </Text>
      )}
      <View style={{ gap: 8, paddingTop: 14 }}>
        {shown.map((g) => {
          const used = model.lastUsed(workout, g.id);
          return (
            <GripRow
              key={g.id}
              name={g.name}
              meta={gripMeta(model.sessions, g.id, today, unit, true)}
              load={used === null ? "" : setupLabel(workout.kind, used, unit)}
              on={selected.includes(g.id)}
              multi={multi}
              onPress={() => pick(g.id)}
              onEdit={() => edit(g.id)}
            />
          );
        })}
      </View>
      <AddGrip onAdded={choose} />
    </HangSheet>
  );
}
