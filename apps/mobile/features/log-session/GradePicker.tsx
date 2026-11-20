import React from "react";
import { Pressable, Text } from "react-native";
import {
  draftGradeLabel,
  gradeOptions,
  pickerScale,
  withPickedGrade,
  type ClimbDraft,
} from "@sendtally/features/log-session";
import { useDisplayScales } from "@sendtally/features/settings";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { SelectRow } from "../../components/SelectRow";
import { pressRow } from "../../lib/press";

export type GradePickerProps = {
  climb: ClimbDraft;
  onChange: (climb: ClimbDraft) => void;
};

export function GradePicker({ climb, onChange }: GradePickerProps): React.ReactElement {
  const scales = useDisplayScales();
  const shown = draftGradeLabel(climb, scales);
  return (
    <SelectRow label={t("common.grade")} value={shown} valueFont={fonts.monoSemiBold}>
      {(close) =>
        gradeOptions(pickerScale(climb, scales)).map((g) => {
          const selected = g === shown;
          return (
            <Pressable
              key={g}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => {
                onChange(withPickedGrade(climb, g, scales));
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
