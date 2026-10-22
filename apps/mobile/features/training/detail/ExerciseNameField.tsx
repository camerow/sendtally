import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors, radius } from "@sendtally/design/tokens";
import { exerciseSuggestions } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { pressRow } from "../../../lib/press";
import { type } from "../type";
import { DetailTextInput } from "./DetailTextInput";

export type ExerciseNameFieldProps = {
  value: string;
  names: readonly string[];
  inSheet: boolean;
  onChange: (name: string) => void;
};

/** Free text, offering the names the user has logged before while it has focus. */
export function ExerciseNameField({
  value,
  names,
  inSheet,
  onChange,
}: ExerciseNameFieldProps): React.ReactElement {
  const [focused, setFocused] = React.useState(false);
  const suggestions = focused ? exerciseSuggestions(names, value) : [];
  return (
    <View style={{ gap: 4 }}>
      <DetailTextInput
        value={value}
        onChange={onChange}
        label={t("activities.exercise")}
        placeholder={t("activities.exercisePlaceholder")}
        maxLength={80}
        inSheet={inSheet}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[type.bodyBold, { fontSize: 16 }]}
      />
      {suggestions.length > 0 && (
        <View
          style={{
            padding: 4,
            borderWidth: 1,
            borderColor: colors.lineOnLightStrong,
            borderRadius: radius.control,
            backgroundColor: colors.white,
          }}
        >
          {suggestions.map((name) => (
            <Pressable
              key={name}
              onPress={() => onChange(name)}
              accessibilityRole="button"
              style={pressRow({
                minHeight: 44,
                justifyContent: "center",
                paddingHorizontal: 10,
                borderRadius: radius.sm,
              })}
            >
              <Text style={[type.body, { fontSize: 15, color: colors.gunmetal }]}>{name}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
