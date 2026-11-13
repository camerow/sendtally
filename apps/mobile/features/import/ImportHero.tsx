import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { Label } from "../training/components/Label";
import { Title } from "../training/components/Title";
import { type } from "../training/type";

/** A review's head: what the file is, the title, and the file's name and dates. */
export function ImportHero({
  kicker,
  kickerColor,
  title,
  meta,
}: {
  kicker: string;
  kickerColor: string;
  title: string;
  meta: string;
}): React.ReactElement {
  return (
    <View style={{ gap: 4 }}>
      <Label color={kickerColor}>{kicker}</Label>
      <Title size={34}>{title}</Title>
      <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>{meta}</Text>
    </View>
  );
}
