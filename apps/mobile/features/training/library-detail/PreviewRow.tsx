import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { pressRow } from "../../../lib/press";
import { type } from "../type";

export type PreviewRowProps = {
  title: string;
  detail: string;
  /** A muted line under it, such as what it alternates with. */
  note?: string;
  /** Its rest, muted at the end of that line. */
  rest?: string;
  onPress?: () => void;
};

/** One line of a workout's body: what to do and how much in mono, and what else to know. */
export function PreviewRow({
  title,
  detail,
  note,
  rest,
  onPress,
}: PreviewRowProps): React.ReactElement {
  const faint = [type.body, { flex: 1, fontSize: 13, color: colors.textMuted }];
  return (
    <Pressable
      onPress={onPress}
      disabled={onPress === undefined}
      accessibilityRole={onPress === undefined ? undefined : "button"}
      style={pressRow({
        gap: 3,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.lineOnLightSoft,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10 }}>
        <Text style={[type.bodyBold, { flex: 1, fontSize: 15, color: colors.gunmetal }]}>
          {title}
        </Text>
        {detail !== "" && (
          <Text
            style={[
              type.mono,
              { flexShrink: 1, textAlign: "right", fontSize: 13, color: colors.gunmetal },
            ]}
          >
            {detail}
          </Text>
        )}
      </View>
      {(note !== undefined || rest !== undefined) && (
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10 }}>
          <Text style={faint}>{note ?? ""}</Text>
          {rest !== undefined && (
            <Text style={[type.mono, { fontSize: 12, color: colors.textMuted }]}>{rest}</Text>
          )}
        </View>
      )}
    </Pressable>
  );
}
