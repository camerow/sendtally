import React from "react";
import { Pressable, Text, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { pressRow } from "../../lib/press";
import { resultMeta, resultName, resultRow } from "./styles";

export type Candidate = { id: string; name: string; meta: string };

/** Look-alikes the server found: tap one to use it, or save again to say yours is new. */
export function Candidates({
  candidates,
  onPick,
}: {
  candidates: Candidate[];
  onPick: (id: string) => void;
}): React.ReactElement {
  return (
    <View
      accessibilityRole="summary"
      style={{
        gap: 4,
        padding: 12,
        borderRadius: radius.control,
        backgroundColor: "rgba(249,220,92,0.22)",
      }}
    >
      <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.gunmetal }}>
        {t("areas.isItOneOfThese")}
      </Text>
      <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.textSecondary }}>
        {t("areas.isItOneOfTheseTapHint")}
      </Text>
      {candidates.map((c) => (
        <Pressable
          key={c.id}
          accessibilityRole="button"
          accessibilityLabel={c.name}
          onPress={() => onPick(c.id)}
          style={pressRow({ ...resultRow, backgroundColor: colors.white })}
        >
          <Text numberOfLines={1} style={resultName}>
            {c.name}
          </Text>
          <Text style={resultMeta}>{c.meta}</Text>
        </Pressable>
      ))}
    </View>
  );
}
