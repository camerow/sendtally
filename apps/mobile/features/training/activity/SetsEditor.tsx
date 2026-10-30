import React from "react";
import { Pressable, Text, View } from "react-native";
import type { ItemDone, SetDone, WeightUnit } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { formatNumber, t } from "@sendtally/features/i18n";
import { press, pressRow } from "../../../lib/press";
import { HangIcon } from "../components/HangIcon";
import { Label } from "../components/Label";
import { SetDoneFields } from "../sets/SetDoneFields";
import { type } from "../type";

export type SetsEditorProps = {
  done: ItemDone;
  unit: WeightUnit;
  onChange: (set: number, value: SetDone) => void;
  onRemove: (set: number) => void;
  onAdd: () => void;
};

const NUMBER = { width: 30, paddingLeft: 4 } as const;

/** An exercise's sets as rows to edit: reps and weight or seconds, a remove each, and one more like the last. */
export function SetsEditor({
  done,
  unit,
  onChange,
  onRemove,
  onAdd,
}: SetsEditorProps): React.ReactElement {
  const lifting = done.sets.some((s) => s.reps !== undefined || s.weightKg !== undefined);
  return (
    <View>
      <View style={{ flexDirection: "row", gap: 6, minHeight: 22, alignItems: "center" }}>
        <Label small color={colors.textMuted} style={NUMBER}>
          {t("activities.colSet")}
        </Label>
        <Label small color={colors.textMuted}>
          {lifting ? t("activities.colRepsWeight") : t("activities.hold")}
        </Label>
      </View>
      {done.sets.map((set, i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            minHeight: 48,
            borderBottomWidth: 1,
            borderBottomColor: colors.lineOnLightSoft,
          }}
        >
          <Text style={[type.monoBold, NUMBER, { fontSize: 14, color: colors.gunmetal }]}>
            {formatNumber(i + 1)}
          </Text>
          <View style={{ flex: 1 }}>
            <SetDoneFields
              set={set}
              lifting={lifting}
              unit={unit}
              label={t("activities.setOf", { exercise: done.exercise, n: i + 1 })}
              onChange={(value) => onChange(i, value)}
            />
          </View>
          <Pressable
            onPress={() => onRemove(i)}
            accessibilityRole="button"
            accessibilityLabel={t("activities.removeSet", { n: i + 1 })}
            style={press({ width: 44, height: 44, alignItems: "center", justifyContent: "center" })}
          >
            <HangIcon name="remove" color={colors.watermelonInk} size={20} strokeWidth={1.8} />
          </Pressable>
        </View>
      ))}
      <Pressable
        onPress={onAdd}
        accessibilityRole="button"
        style={pressRow({ flexDirection: "row", alignItems: "center", gap: 8, minHeight: 48 })}
      >
        <HangIcon name="plus" color={colors.gunmetal} size={18} />
        <Text style={[type.bodyBold, { flex: 1, fontSize: 14.5, color: colors.gunmetal }]}>
          {t("activities.addSet")}
        </Text>
        <Text style={[type.mono, { fontSize: 12, color: colors.textMuted }]}>
          {t("activities.copiesSet", { n: done.sets.length })}
        </Text>
      </Pressable>
    </View>
  );
}
