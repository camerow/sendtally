import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { press } from "../../../lib/press";
import { HangIcon } from "../components/HangIcon";
import { type } from "../type";
import { letterOf } from "./editorState";
import { letterLook } from "./LetterBadge";

export type PatternRowProps = {
  pattern: readonly number[];
  onCycle: (step: number) => void;
  onRemove: (step: number) => void;
  onAdd: () => void;
};

const STEP = 44;

/** The order sessions take the variations in: tap a step for the next letter, hold it to drop it. */
export function PatternRow({
  pattern,
  onCycle,
  onRemove,
  onAdd,
}: PatternRowProps): React.ReactElement {
  return (
    <View
      style={{ gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.lineOnLightSoft }}
    >
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
        <Text style={[type.bodyBold, { flexGrow: 1, fontSize: 16, color: colors.gunmetal }]}>
          {t("workouts.pattern")}
        </Text>
        {pattern.map((variation, step) => {
          const look = letterLook(variation);
          const letter = letterOf(variation);
          return (
            <Pressable
              key={step}
              onPress={() => onCycle(step)}
              onLongPress={() => onRemove(step)}
              accessibilityRole="button"
              accessibilityLabel={t("workouts.patternStep", { n: step + 1, letter })}
              style={press({
                width: STEP,
                height: STEP,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: look.backgroundColor,
              })}
            >
              <Text style={[type.monoBold, { fontSize: 16, color: look.color }]}>{letter}</Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel={t("workouts.addStep")}
          style={press({
            width: STEP,
            height: STEP,
            borderRadius: 10,
            borderWidth: 1.5,
            borderStyle: "dashed",
            borderColor: colors.lineOnLightStrong,
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <HangIcon name="plus" color={colors.gunmetal} size={16} strokeWidth={2.2} />
        </Pressable>
      </View>
      <Text style={[type.body, { fontSize: 13, lineHeight: 19, color: colors.textSecondary }]}>
        {t("workouts.patternHint")}
      </Text>
    </View>
  );
}
