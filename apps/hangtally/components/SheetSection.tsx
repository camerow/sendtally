import React from "react";
import { View } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { Label } from "./Label";

export type SheetSectionProps = {
  label: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  gap?: number;
};

/** A labelled group inside a light sheet. */
export function SheetSection({
  label,
  aside,
  children,
  gap = 8,
}: SheetSectionProps): React.ReactElement {
  const c = useTheme();
  return (
    <View style={{ gap }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 24,
        }}
      >
        <Label color={c.ink2}>{label}</Label>
        {aside}
      </View>
      {children}
    </View>
  );
}
