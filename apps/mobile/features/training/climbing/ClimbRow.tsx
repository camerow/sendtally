import React from "react";
import { Pressable, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import type { ClimbDraft } from "@sendtally/features/log-session";
import { useDisplayScales } from "@sendtally/features/settings";
import { Stepper } from "../components/Stepper";
import { SetRow } from "../sets/SetRow";
import { ClimbGrade, climbGradeText } from "./ClimbGrade";

export type ClimbRowProps = {
  position: number;
  climb: ClimbDraft;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onTries: (tries: number) => void;
  /** The Sent tick. */
  onFlip: () => void;
  /** A hold opens the climb's editor, to name it. */
  onEdit: () => void;
};

/** One climb of the set being climbed: its grade, its attempts on − and +, and a Sent tick. */
export function ClimbRow({
  position,
  climb,
  selected,
  onSelect,
  onRemove,
  onTries,
  onFlip,
  onEdit,
}: ClimbRowProps): React.ReactElement {
  const scales = useDisplayScales();
  const grade = climbGradeText(climb, scales);
  const name = climb.name.trim();
  const label = t("tally.climbOfSet", { n: position, grade });
  const attempts = t("climbs.attempts");
  return (
    <SetRow
      position={String(position)}
      {...(name === "" ? {} : { name })}
      label={`${label}, ${t("common.sent")}`}
      ticked={climb.kind === "send"}
      onToggle={onFlip}
      selected={selected}
      onSelect={onSelect}
      onRemove={onRemove}
      removeLabel={t("tally.removeClimb", { grade })}
    >
      <Pressable
        onPress={onSelect}
        onLongPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected }}
        accessibilityHint={t("tally.editClimb")}
        accessibilityActions={[{ name: "longpress", label: t("tally.editClimb") }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === "longpress") onEdit();
        }}
        hitSlop={{ top: 12, bottom: 12 }}
      >
        <ClimbGrade climb={climb} scales={scales} />
      </Pressable>
      <View style={{ flex: 1, alignItems: "center" }}>
        <Stepper
          compact
          label={attempts}
          accessibilityLabel={`${label} · ${attempts}`}
          value={climb.tries}
          min={1}
          max={99}
          step={1}
          onChange={onTries}
          onStep={(d) => onTries(climb.tries + d)}
          decreaseLabel={t("hang.decrease", { field: `${label} · ${attempts}` })}
          increaseLabel={t("hang.increase", { field: `${label} · ${attempts}` })}
          surface="plain"
        />
      </View>
    </SetRow>
  );
}
