import React from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fonts } from "@sendtally/design/tokens";
import type { TrendRange } from "@sendtally/features/trends";
import { BackButton } from "./BackButton";
import { RangeChips } from "./RangeChips";

export type InsightsFrameProps = {
  back: string;
  title: string;
  member: boolean | null;
  range: TrendRange;
  onRange: (range: TrendRange) => void;
  children: React.ReactNode;
};

/** An insights screen: back, its title, the ranges, then whatever it measures. */
export function InsightsFrame({
  back,
  title,
  member,
  range,
  onRange,
  children,
}: InsightsFrameProps): React.ReactElement {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
      <View style={{ paddingHorizontal: 12 }}>
        <BackButton label={back} />
      </View>
      <ScrollView contentContainerStyle={{ gap: 14, paddingHorizontal: 18, paddingBottom: 32 }}>
        <Text
          accessibilityRole="header"
          style={{
            fontFamily: fonts.displayHeavy,
            fontSize: 34,
            lineHeight: 38,
            letterSpacing: -1,
            color: colors.gunmetal,
          }}
        >
          {title}
        </Text>
        <RangeChips member={member} shown={range} onPick={onRange} />
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
