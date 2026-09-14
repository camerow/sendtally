import React from "react";
import { Pressable, Text } from "react-native";
import { gradeOptions, type ClimbDraft } from "@sendtally/features/log-session";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { SelectRow } from "../../components/SelectRow";
import { pressRow } from "../../lib/press";

export type GradePickerProps = {
  climb: ClimbDraft;
  onChange: (climb: ClimbDraft) => void;
};

export function GradePicker({ climb, onChange }: GradePickerProps): React.ReactElement {
  return (
    <SelectRow label="Grade" value={climb.grade} mono>
      {(close) =>
        gradeOptions(climb.scale).map((g) => {
          const selected = g === climb.grade;
          return (
            <Pressable
              key={g}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => {
                onChange({ ...climb, grade: g });
                close();
              }}
              style={pressRow({
                height: 48,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 12,
                borderRadius: radius.control,
                backgroundColor: selected ? "rgba(249,220,92,0.35)" : "transparent",
              })}
            >
              <Text
                style={{
                  fontFamily: selected ? fonts.monoSemiBold : fonts.monoMedium,
                  fontSize: 15,
                  color: colors.gunmetal,
                }}
              >
                {g}
              </Text>
              {selected && (
                <Icon name="check" color={colors.gunmetal} size={18} strokeWidth={2.2} />
              )}
            </Pressable>
          );
        })
      }
    </SelectRow>
  );
}
