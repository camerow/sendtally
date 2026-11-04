import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { Label } from "../features/training/components/Label";
import { AddButton } from "./AddButton";

/** A detail page section's heading: its label, and a round + when something can be added. */
export function SectionHeading({
  title,
  add,
}: {
  title: string;
  add?: { label: string; onPress: () => void } | undefined;
}): React.ReactElement {
  return (
    <View
      style={{
        minHeight: 36,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Label color={colors.gunmetal}>{title}</Label>
      {add !== undefined && <AddButton label={add.label} onPress={add.onPress} />}
    </View>
  );
}
