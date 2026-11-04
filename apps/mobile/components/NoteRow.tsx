import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { pressRow } from "../lib/press";
import { type } from "../features/training/type";

/** A note, shaped like a history row: its date, an optional title, and the text. Tap opens it. */
export function NoteRow({
  date,
  title,
  body,
  onPress,
}: {
  date: string;
  title?: string | null;
  body: string;
  onPress: () => void;
}): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={pressRow({
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        paddingVertical: 10,
        paddingHorizontal: 8,
        marginHorizontal: -8,
        borderRadius: 10,
      })}
    >
      <Text
        style={[type.mono, { width: 52, paddingTop: 2, fontSize: 12, color: colors.textSecondary }]}
      >
        {date}
      </Text>
      <View style={{ flex: 1, gap: 2 }}>
        {title != null && title !== "" && (
          <Text style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>{title}</Text>
        )}
        {body !== "" && (
          <Text
            numberOfLines={4}
            style={[type.body, { fontSize: 14.5, lineHeight: 21, color: colors.gunmetal }]}
          >
            {body}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
