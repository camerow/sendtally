import React from "react";
import { Text, View } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { type } from "../theme/type";
import { Label } from "./Label";

export type DashedPanelProps = { title?: string; titleColor?: string; body: string };

/** An empty state on the dark ground: a dashed outline around a line or two. */
export function DashedPanel({ title, titleColor, body }: DashedPanelProps): React.ReactElement {
  const c = useTheme();
  return (
    <View
      style={{
        gap: 6,
        paddingVertical: 20,
        paddingHorizontal: 22,
        borderRadius: 20,
        borderWidth: 1.5,
        borderStyle: "dashed",
        borderColor: c.lineDark,
      }}
    >
      {title !== undefined && <Label color={titleColor ?? c.rest}>{title}</Label>}
      <Text style={[type.body, { fontSize: 15, lineHeight: 22, color: c.onDark2 }]}>{body}</Text>
    </View>
  );
}
