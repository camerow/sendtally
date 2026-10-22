import React from "react";
import { Pressable, Text, View } from "react-native";
import type { HangSessionRecord } from "@sendtally/api-client";
import { colors, effortColor } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { pressRow } from "../../../lib/press";
import { Label } from "../components/Label";
import { useHangData } from "../data/HangDataContext";
import { type } from "../type";
import { sessionText } from "./sessionText";

export type HistoryRowProps = { session: HangSessionRecord; onPress: () => void };

/** A logged session in a workout's history: grip, date and effort, with an effort stripe and completion. */
export function HistoryRow({ session, onPress }: HistoryRowProps): React.ReactElement {
  const { model } = useHangData();
  const text = sessionText(session, model);
  const complete = session.pct >= 100;
  const pctColor = complete ? colors.gunmetal : colors.petalInk;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={pressRow({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 11,
        borderBottomWidth: 1,
        borderBottomColor: colors.lineOnLight,
      })}
    >
      <View
        style={{
          width: 6,
          height: 32,
          borderRadius: 3,
          backgroundColor: session.rpe === null ? colors.lineOnLight : effortColor(session.rpe),
        }}
      />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>{text.grip}</Text>
        <Label small color={colors.textSecondary}>
          {`${text.date} · ${text.rpe}`}
        </Label>
      </View>
      <View style={{ alignItems: "flex-end", gap: 5 }}>
        <Text style={[type.monoBold, { fontSize: 14, color: colors.gunmetal }]}>{text.load}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Label small color={pctColor}>
            {complete ? t("hang.complete") : `${session.pct}%`}
          </Label>
          <View
            style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.lineOnLight }}
          >
            <View
              style={{
                height: 4,
                borderRadius: 2,
                width: `${session.pct}%`,
                backgroundColor: pctColor,
              }}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
