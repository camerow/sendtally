import React from "react";
import { Pressable, View } from "react-native";
import type { SetClimb, SetDone } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { withClimbSent, withClimbTries } from "@sendtally/features/activities";
import type { GradePickerModel } from "@sendtally/features/workouts";
import { Label } from "../components/Label";
import { ClimbHeadings } from "./ClimbHeadings";
import { ClimbRow } from "./ClimbRow";
import { GradePicker } from "./GradePicker";

/** A climb of a logged set, by where it sits. */
export type ClimbAt = { set: number; index: number };

export type ClimbSetsEditProps = {
  sets: readonly SetDone[];
  /** The set the grade picker is under, when it is on this exercise. */
  picking: number | null;
  picker: GradePickerModel;
  selected: ClimbAt | null;
  onSelect: (at: ClimbAt) => void;
  onPressSet: (set: number) => void;
  onChange: (at: ClimbAt, climb: SetClimb) => void;
  onRemove: (at: ClimbAt) => void;
};

/** A logged climbing exercise's sets as the run draws them: a row per climb, the grades under one set. */
export function ClimbSetsEdit({
  sets,
  picking,
  picker,
  selected,
  onSelect,
  onPressSet,
  onChange,
  onRemove,
}: ClimbSetsEditProps): React.ReactElement {
  const headed = sets.findIndex((s) => (s.climbs?.length ?? 0) > 0);
  return (
    <>
      {sets.map((set, s) => (
        <View key={s}>
          <Pressable
            onPress={() => onPressSet(s)}
            accessibilityRole="button"
            accessibilityLabel={t("workouts.climbInSet", { set: s + 1 })}
            style={{ minHeight: 40, paddingTop: 6, justifyContent: "center" }}
          >
            <Label small color={colors.textSecondary}>
              {t("tally.setLabel", { set: s + 1 })}
            </Label>
          </Pressable>
          {s === headed && <ClimbHeadings />}
          {(set.climbs ?? []).map((climb, index) => (
            <ClimbRow
              key={index}
              position={index + 1}
              climb={climb}
              selected={selected?.set === s && selected.index === index}
              onSelect={() => onSelect({ set: s, index })}
              onRemove={() => onRemove({ set: s, index })}
              onTries={(tries) => onChange({ set: s, index }, withClimbTries(climb, tries))}
              onFlip={() => onChange({ set: s, index }, withClimbSent(climb))}
            />
          ))}
          {picking === s && <GradePicker tally={picker} />}
        </View>
      ))}
    </>
  );
}
