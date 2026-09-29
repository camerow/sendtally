import React from "react";
import { Text, View } from "react-native";
import type { Workout } from "@sendtally/core/hang";
import { kindLabel, workoutBlurb } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { KindTag } from "../../components/KindTag";
import { Label } from "../../components/Label";
import { Title } from "../../components/Title";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";

export function WorkoutIntro({ workout }: { workout: Workout }): React.ReactElement {
  const c = useTheme();
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <KindTag kind={workout.kind} label={kindLabel(workout.kind)} />
        {workout.kind === "hang" && (
          <Label
            color={c.onDark}
            style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 6,
              borderWidth: 1,
              borderColor: c.lineDark,
            }}
          >
            {t("hang.edgeMm", { n: workout.edgeMm })}
          </Label>
        )}
      </View>
      <Title size={40} color={c.onDark}>
        {workout.name}
      </Title>
      <Text style={[type.body, { fontSize: 15, lineHeight: 22, color: c.onDark2 }]}>
        {workoutBlurb(workout)}
      </Text>
    </View>
  );
}
