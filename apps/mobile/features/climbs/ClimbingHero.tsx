import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { Label } from "../training/components/Label";
import { Title } from "../training/components/Title";
import { CategoryMark } from "../training/library/CategoryMark";
import { KIND_LOOK } from "../training/today/kindLook";
import { type } from "../training/type";

export type ClimbingHeroProps = {
  kind: string;
  state?: string;
  /** At the end of the kicker row, as a climb's Project chip. */
  aside?: React.ReactNode;
  title: string;
  meta: string;
};

/** A climbing detail screen's top: the climbing mark and kicker, the title, and one meta line. */
export function ClimbingHero({
  kind,
  state = "",
  aside,
  title,
  meta,
}: ClimbingHeroProps): React.ReactElement {
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <CategoryMark kind="climbing" size={28} />
        <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          <Label color={KIND_LOOK.climbing.ink}>{kind}</Label>
          {state !== "" && <Label color={colors.textSecondary}>{`· ${state}`}</Label>}
        </View>
        {aside}
      </View>
      <Title size={34}>{title}</Title>
      <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>{meta}</Text>
    </View>
  );
}
