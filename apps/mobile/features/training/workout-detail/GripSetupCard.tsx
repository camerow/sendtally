import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import type { HangWorkout } from "@sendtally/core/hang";
import { setupLabel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Label } from "../components/Label";
import { useHangData } from "../data/HangDataContext";
import { type } from "../type";

export type GripSetupCardProps = { workout: HangWorkout; gripId: string };

/** The workout's grip, with the edge and weight last used on it. */
export function GripSetupCard({ workout, gripId }: GripSetupCardProps): React.ReactElement {
  const { model } = useHangData();
  const last = model.lastUsed(workout, gripId);
  return (
    <View style={{ borderRadius: 16, overflow: "hidden", backgroundColor: colors.surfaceSoft }}>
      <View style={{ gap: 3, paddingVertical: 12, paddingHorizontal: 16 }}>
        <Label small color={colors.textSecondary}>
          {t("hang.grip")}
        </Label>
        <Text style={[type.bodyBold, { fontSize: 17, color: colors.gunmetal }]}>
          {model.gripName(gripId)}
        </Text>
      </View>
      {last !== null && (
        <>
          <View style={{ height: 1, marginHorizontal: 16, backgroundColor: colors.lineOnLight }} />
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 14,
              paddingHorizontal: 16,
            }}
          >
            <Label small color={colors.textSecondary}>
              {t("hang.lastUsed")}
            </Label>
            <Text style={[type.mono, { fontSize: 15, color: colors.gunmetal }]}>
              {setupLabel(workout.kind, last, model.settings.units)}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}
