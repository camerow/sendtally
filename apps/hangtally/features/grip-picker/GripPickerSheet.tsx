import React from "react";
import { Text, View } from "react-native";
import { byDate, hasLoad, type Workout } from "@sendtally/core/hang";
import { loadLabel, shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Sheet } from "../../components/Sheet";
import { SheetHeader } from "../../components/SheetHeader";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";
import { useHangData } from "../data/HangDataContext";
import { AddGrip } from "./AddGrip";
import { GripRow } from "./GripRow";

export type GripPickerSheetProps = {
  visible: boolean;
  workout: Workout;
  multi: boolean;
  selected: readonly string[];
  onPick: (gripId: string) => void;
  onClose: () => void;
};

/** Choose grips (several, stays open) or choose a grip (one, closes on pick). */
export function GripPickerSheet({
  visible,
  workout,
  multi,
  selected,
  onPick,
  onClose,
}: GripPickerSheetProps): React.ReactElement | null {
  const c = useTheme();
  const { model } = useHangData();
  const unit = model.settings.units;

  const pick = (id: string): void => {
    onPick(id);
    if (!multi) onClose();
  };
  const choose = (id: string): void => {
    if (!multi || !selected.includes(id)) pick(id);
  };

  return (
    <Sheet visible={visible} onClose={onClose} closeLabel={t("hang.closeGripPicker")}>
      <SheetHeader
        kicker={workout.name}
        title={multi ? t("hang.chooseGrips") : t("hang.chooseAGrip")}
        action={t("hang.done")}
        onAction={onClose}
      />
      <Text
        style={[
          type.body,
          { fontSize: 14, lineHeight: 21, color: c.ink2, paddingTop: 8, paddingBottom: 14 },
        ]}
      >
        {multi ? t("hang.gripPickerMulti") : t("hang.gripPickerSingle")}
      </Text>
      <View style={{ gap: 8 }}>
        {model.grips.map((g) => {
          const logs = model.sessions
            .filter((s) => s.workoutId === workout.id && s.gripId === g.id)
            .sort(byDate);
          const last = logs[logs.length - 1];
          const meta =
            last !== undefined
              ? t("hang.gripUsed", { count: logs.length, date: shortDate(last.date) })
              : g.custom
                ? t("hang.gripYoursNotTried")
                : t("hang.gripNotTried");
          return (
            <GripRow
              key={g.id}
              name={g.name}
              meta={meta}
              load={
                hasLoad(model.data.loads, workout.id, g.id)
                  ? loadLabel(workout.kind, model.load(workout, g.id), unit)
                  : ""
              }
              on={selected.includes(g.id)}
              multi={multi}
              onPress={() => pick(g.id)}
            />
          );
        })}
      </View>
      <AddGrip onAdded={choose} />
    </Sheet>
  );
}
