import React from "react";
import { Text, View } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";
import { Label } from "../training/components/Label";
import { Title } from "../training/components/Title";
import { CategoryMark } from "../training/library/CategoryMark";
import { KIND_LOOK } from "../training/today/kindLook";
import { type } from "../training/type";

export type ClimbingHeroProps = {
  /** The kicker beside the climbing mark; none leaves the title to lead. */
  kind?: string;
  title: string;
  /** Right under the title, as a climb's Project pill. */
  status?: React.ReactNode;
  /** Where it was, between the title and the meta line. */
  place?: string;
  meta: string;
};

/** A climbing detail screen's top: the climbing mark and kicker, the title, its status, where, and a meta line. */
export function ClimbingHero({
  kind,
  title,
  status,
  place = "",
  meta,
}: ClimbingHeroProps): React.ReactElement {
  return (
    <View style={{ gap: 8 }}>
      {kind !== undefined && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <CategoryMark kind="climbing" size={28} />
          <Label color={KIND_LOOK.climbing.ink}>{kind}</Label>
        </View>
      )}
      <Title size={34}>{title}</Title>
      {status !== undefined && <View style={{ alignSelf: "flex-start" }}>{status}</View>}
      {place !== "" && (
        <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 16, color: colors.gunmetal }}>
          {place}
        </Text>
      )}
      <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>{meta}</Text>
    </View>
  );
}
