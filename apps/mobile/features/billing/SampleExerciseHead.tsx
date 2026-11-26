import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { YoursTag } from "../first-run/plan/components/YoursTag";
import { type } from "../training/type";

/** A sample exercise as a workout lists it: its name, then its sets, reps and load. */
export function SampleExerciseHead({
  name,
  work,
  yours = false,
}: {
  name: string;
  work: string;
  /** Tagged as the user's own. */
  yours?: boolean;
}): React.ReactElement {
  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text
          numberOfLines={1}
          style={[
            type.bodyBold,
            { flexShrink: 1, fontSize: 15, lineHeight: 19, color: colors.gunmetal },
          ]}
        >
          {name}
        </Text>
        {yours && <YoursTag />}
      </View>
      <Text
        numberOfLines={1}
        style={[type.monoBold, { fontSize: 13, lineHeight: 17, color: colors.gunmetal }]}
      >
        {work}
      </Text>
    </View>
  );
}
