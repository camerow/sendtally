import React from "react";
import { View } from "react-native";
import { colors, radius } from "@sendtally/design/tokens";
import { SAMPLE_WEEK } from "@sendtally/features/settings";
import { DarkWeek } from "../../components/DarkWeek";
import { SamplePyramid } from "../../components/SamplePyramid";

const WEEK = SAMPLE_WEEK.map((kind) => (kind === null ? null : [kind]));

/** The chooser's two pictures in one dark card: a sample pyramid over a sample week. */
export function WelcomeCard(): React.ReactElement {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        gap: 18,
        padding: 16,
        borderRadius: radius.panel,
        backgroundColor: colors.gunmetal,
      }}
    >
      <SamplePyramid tone="dark" counts={false} />
      <DarkWeek week={WEEK} />
    </View>
  );
}
