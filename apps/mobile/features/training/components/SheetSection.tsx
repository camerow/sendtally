import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { Label } from "./Label";

export type SheetSectionProps = {
  label: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  gap?: number;
};

/** A labelled group inside a sheet. */
export function SheetSection({
  label,
  aside,
  children,
  gap = 8,
}: SheetSectionProps): React.ReactElement {
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
        <Label color={colors.textSecondary}>{label}</Label>
        {aside}
      </View>
      {children}
    </View>
  );
}
