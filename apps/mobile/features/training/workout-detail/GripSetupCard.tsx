import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { liveSchedules, type HangSetup, type Workout } from "@sendtally/core/hang";
import { setupLabel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../../components/Icon";
import { pressRow } from "../../../lib/press";
import { Label } from "../components/Label";
import { useHangData } from "../data/HangDataContext";
import { type } from "../type";

export type GripSetupCardProps = { workout: Workout; gripId: string; onChooseGrip: () => void };

/** The chosen grip, with the edge and weight planned for it and last used on it. */
export function GripSetupCard({
  workout,
  gripId,
  onChooseGrip,
}: GripSetupCardProps): React.ReactElement {
  const { model, today } = useHangData();
  const grip = model.gripName(gripId);
  const schedule = liveSchedules(model.data.schedules, today, workout.id).find(
    (s) => s.gripId === gripId
  );
  const last = model.lastUsed(workout, gripId);
  const rows: Array<{ label: string; setup: HangSetup }> = [
    ...(schedule === undefined
      ? []
      : [{ label: t("hang.plannedSetup"), setup: model.setup(workout, gripId, { schedule }) }]),
    ...(last === null ? [] : [{ label: t("hang.lastUsed"), setup: last }]),
  ];

  return (
    <View style={{ borderRadius: 16, overflow: "hidden", backgroundColor: colors.surfaceSoft }}>
      <Pressable
        onPress={onChooseGrip}
        accessibilityRole="button"
        style={pressRow({
          minHeight: 64,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingVertical: 12,
          paddingHorizontal: 16,
        })}
      >
        <View style={{ flex: 1, gap: 3 }}>
          <Label small color={colors.textSecondary}>
            {t("hang.gripTapToChange")}
          </Label>
          <Text style={[type.bodyBold, { fontSize: 17, color: colors.gunmetal }]}>{grip}</Text>
        </View>
        <Icon name="chevron" color={colors.gunmetal} size={18} strokeWidth={2} />
      </Pressable>
      <View style={{ height: 1, marginHorizontal: 16, backgroundColor: colors.lineOnLight }} />
      <View style={{ gap: 10, paddingVertical: 14, paddingHorizontal: 16 }}>
        {rows.length === 0 ? (
          <Text style={[type.body, { fontSize: 13, lineHeight: 19, color: colors.textSecondary }]}>
            {t("hang.setupEachTime")}
          </Text>
        ) : (
          rows.map(({ label, setup }) => (
            <View
              key={label}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Label small color={colors.textSecondary}>
                {label}
              </Label>
              <Text style={[type.mono, { fontSize: 15, color: colors.gunmetal }]}>
                {setupLabel(workout.kind, setup, model.settings.units)}
              </Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
}
