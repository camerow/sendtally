import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import type { Workout } from "@sendtally/core/hang";
import { kindLabel, workoutBlurb } from "@sendtally/features/hang";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { type } from "../type";

export function WorkoutIntro({ workout }: { workout: Workout }): React.ReactElement {
  return (
    <View style={{ gap: 6 }}>
      <Label color={colors.petalInk}>{kindLabel(workout.kind)}</Label>
      <Title size={38}>{workout.name}</Title>
      <Text
        style={[
          type.body,
          { paddingTop: 4, fontSize: 15, lineHeight: 22, color: colors.textSecondary },
        ]}
      >
        {workoutBlurb(workout)}
      </Text>
    </View>
  );
}
