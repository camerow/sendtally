import React from "react";
import { t } from "@sendtally/features/i18n";
import type { ClimbDraft } from "@sendtally/features/log-session";
import { useDisplayScales } from "@sendtally/features/settings";
import { Icon } from "../../components/Icon";
import { NumberField } from "../../components/NumberField";
import { SetRow } from "../components/SetRow";
import { Stepper } from "../components/Stepper";
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
  /** Opens the climb's editor, to name it; shown on the selected row. */
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
  const attempts = `${label} · ${t("climbs.attempts")}`;
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
      <button
        type="button"
        className="climb-select"
        aria-label={label}
        aria-pressed={selected}
        onClick={onSelect}
      >
        <ClimbGrade climb={climb} scales={scales} />
      </button>
      {selected && (
        <button
          type="button"
          className="climb-edit"
          aria-label={t("tally.editClimb")}
          title={t("tally.editClimb")}
          onClick={onEdit}
        >
          <Icon name="pencil" size={16} strokeWidth={1.8} />
        </button>
      )}
      <span className="climb-attempts">
        <Stepper
          compact
          onStep={(d) => onTries(climb.tries + d)}
          canDecrease={climb.tries > 1}
          canIncrease={climb.tries < 99}
          decreaseLabel={t("hang.decrease", { field: attempts })}
          increaseLabel={t("hang.increase", { field: attempts })}
        >
          <NumberField
            compact
            label={attempts}
            value={climb.tries}
            mode={{ kind: "number", min: 1, max: 99, step: 1 }}
            onChange={onTries}
          />
        </Stepper>
      </span>
    </SetRow>
  );
}
