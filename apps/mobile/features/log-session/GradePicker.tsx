import React from "react";
import { View } from "react-native";
import { gradeOptions, type ClimbDraft } from "@sendtally/features/log-session";
import { Chip } from "../../components/Chip";
import { SelectRow } from "../../components/SelectRow";

export type GradePickerProps = {
  climb: ClimbDraft;
  onChange: (climb: ClimbDraft) => void;
};

export function GradePicker({ climb, onChange }: GradePickerProps): React.ReactElement {
  return (
    <SelectRow label="Grade" value={climb.grade} mono>
      {(close) => (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingVertical: 6 }}>
          {gradeOptions(climb.scale).map((g) => (
            <Chip
              key={g}
              label={g}
              active={g === climb.grade}
              onPress={() => {
                onChange({ ...climb, grade: g });
                close();
              }}
            />
          ))}
        </View>
      )}
    </SelectRow>
  );
}
