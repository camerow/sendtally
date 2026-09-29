import React from "react";
import { Pressable, Text, View } from "react-native";
import type { HangSessionRecord } from "@sendtally/api-client";
import { effortColor } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { Label } from "../../components/Label";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";
import { useHangData } from "../data/HangDataContext";
import { sessionText } from "./sessionText";

export type HistoryRowProps = {
  session: HangSessionRecord;
  /** Recent sessions lead with the workout; a workout's history leads with the grip. */
  title: "workout" | "grip";
  onPress: () => void;
};

/** A logged session on the dark ground, with an effort stripe and completion. */
export function HistoryRow({ session, title, onPress }: HistoryRowProps): React.ReactElement {
  const c = useTheme();
  const { model } = useHangData();
  const text = sessionText(session, model);
  const complete = session.pct >= 100;
  const pctColor = complete ? c.accent : c.rest;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 11,
        borderBottomWidth: 1,
        borderBottomColor: c.lineDark,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          width: 6,
          height: 34,
          borderRadius: 3,
          backgroundColor: session.rpe === null ? c.lineDark : effortColor(session.rpe),
        }}
      />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[type.bodyBold, { fontSize: 15, color: c.onDark }]}>
          {title === "workout" ? text.name : text.grip}
        </Text>
        <Label small color={c.onDark3}>
          {title === "workout" ? `${text.date} · ${text.grip}` : `${text.date} · ${text.rpe}`}
        </Label>
      </View>
      <View style={{ alignItems: "flex-end", gap: 5 }}>
        <Text style={[type.monoBold, { fontSize: 14, color: c.onDark }]}>{text.load}</Text>
        {title === "workout" ? (
          <Label small color={c.onDark3}>
            {complete ? text.rpe : `${text.rpe} · ${session.pct}%`}
          </Label>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Label small color={pctColor}>
              {complete ? t("hang.complete") : `${session.pct}%`}
            </Label>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: c.lineDark }}>
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
        )}
      </View>
    </Pressable>
  );
}
