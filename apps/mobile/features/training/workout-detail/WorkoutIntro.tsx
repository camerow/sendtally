import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import type { Focus, HangWorkout } from "@sendtally/core/hang";
import { kindLabel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { FocusTag } from "../components/FocusTag";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { type } from "../type";

export type WorkoutIntroProps = {
  workout: HangWorkout;
  description: string;
  focus: Focus | null;
};

export function WorkoutIntro({
  workout,
  description,
  focus,
}: WorkoutIntroProps): React.ReactElement {
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Label color={colors.petalInk}>{kindLabel(workout.kind)}</Label>
        <FocusTag focus={focus} />
      </View>
      <Title size={38}>{workout.name}</Title>
      <Text
        style={[
          type.body,
          { paddingTop: 4, fontSize: 15, lineHeight: 22, color: colors.textSecondary },
        ]}
      >
        {description === "" ? t("hang.workout.mineBlurb") : description}
      </Text>
    </View>
  );
}
