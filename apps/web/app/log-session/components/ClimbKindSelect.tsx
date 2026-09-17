import React from "react";
import { circuitLabel, circuitRangeLabel, findCircuit, type Gym } from "@sendtally/features/gyms";
import {
  climbGradingValue,
  climbKindOf,
  disciplineLabel,
  withClimbGrading,
  type ClimbDraft,
  type GradePrefs,
} from "@sendtally/features/log-session";
import { t } from "@sendtally/features/i18n";
import { climbKindStorage } from "../../lib/climbKindStorage";
import { inputStyle } from "./styles";

export type ClimbKindSelectProps = {
  id?: string;
  climb: ClimbDraft;
  gym: Gym;
  prefs: GradePrefs;
  style?: React.CSSProperties;
  onChange: (climb: ClimbDraft) => void;
};

/** Boulder, route, or one of the gym's circuits; the pick is remembered for the next climb. */
export function ClimbKindSelect({
  id,
  climb,
  gym,
  prefs,
  style,
  onChange,
}: ClimbKindSelectProps): React.ReactElement {
  const stale =
    climb.circuit !== undefined && findCircuit(gym, climb.circuit.id) === null
      ? climb.circuit
      : null;
  return (
    <select
      id={id}
      aria-label={t("logSession.climbKind")}
      value={climbGradingValue(climb)}
      onChange={(e) => {
        const next = withClimbGrading(climb, e.target.value, prefs, gym);
        climbKindStorage.write(climbKindOf(next));
        onChange(next);
      }}
      className="log-session-control"
      style={{ ...inputStyle, height: 46, ...style }}
    >
      {(["boulder", "route"] as const).map((d) => (
        <option key={d} value={d}>
          {disciplineLabel(d)}
        </option>
      ))}
      <optgroup label={gym.name}>
        {gym.circuits.map((c) => (
          <option key={c.id} value={c.id}>
            {`${circuitLabel(c)} · ${circuitRangeLabel(c, gym.scale)}`}
          </option>
        ))}
        {stale !== null && <option value={stale.id}>{stale.label}</option>}
      </optgroup>
    </select>
  );
}
