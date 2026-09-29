import React from "react";
import { Pressable, Text, View } from "react-native";
import type { HangSessionRecord } from "@sendtally/api-client";
import { effortColor } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { Label } from "../../components/Label";
import { press } from "../../lib/press";
import { useTheme } from "../../theme/ThemeContext";
import { rgba } from "../../theme/themes";
import { type } from "../../theme/type";
import { useHangData } from "../data/HangDataContext";
import { sessionText } from "../sessions/sessionText";

export type LoggedRowProps = { session: HangSessionRecord; onPress: () => void };

/** A session logged on the selected day, as a light card. */
export function LoggedRow({ session, onPress }: LoggedRowProps): React.ReactElement {
  const c = useTheme();
  const { model } = useHangData();
  const text = sessionText(session, model);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={press({
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 16,
        backgroundColor: c.card,
      })}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: session.pct >= 100 ? c.accent : c.rest,
        }}
      >
        <Icon name="check" color={c.ink} size={16} strokeWidth={3} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[type.bodyBold, { fontSize: 16, color: c.ink }]}>{text.name}</Text>
        <Label small color={c.ink2}>
          {`${text.grip} · ${text.completion}`}
        </Label>
      </View>
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <Text style={[type.monoBold, { fontSize: 14, color: c.ink }]}>{text.load}</Text>
        <Label
          small
          color={c.ink}
          style={{
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 4,
            overflow: "hidden",
            backgroundColor: session.rpe === null ? c.soft : rgba(effortColor(session.rpe), 0.35),
          }}
        >
          {text.rpe}
        </Label>
      </View>
    </Pressable>
  );
}
