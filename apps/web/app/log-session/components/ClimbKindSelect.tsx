import React from "react";
import { circuitLabel, circuitRangeLabel, withCircuit, type Gym } from "@sendtally/features/gyms";
import {
  climbKindOf,
  disciplineLabel,
  gradeOptions,
  gymOfCircuit,
  withClimbKind,
  type ClimbDraft,
  type GradePrefs,
} from "@sendtally/features/log-session";
import { t } from "@sendtally/features/i18n";
import { climbKindStorage } from "../../lib/climbKindStorage";
import { inputStyle } from "./styles";

const selectStyle: React.CSSProperties = { ...inputStyle, height: 46 };

const gradeStyle: React.CSSProperties = {
  ...selectStyle,
  fontFamily: "var(--font-mono)",
  fontWeight: 600,
};

export type ClimbKindSelectProps = {
  id?: string;
  climb: ClimbDraft;
  gyms: readonly Gym[];
  prefs: GradePrefs;
  style?: React.CSSProperties;
  onChange: (climb: ClimbDraft) => void;
};

/** Boulder, route, endurance, or a gym's circuits; the pick is remembered for the next climb. */
export function ClimbKindSelect({
  id,
  climb,
  gyms,
  prefs,
  style,
  onChange,
}: ClimbKindSelectProps): React.ReactElement {
  return (
    <select
      id={id}
      aria-label={t("logSession.climbKind")}
      value={climbKindOf(climb, gyms)}
      onChange={(e) => {
        const next = withClimbKind(climb, e.target.value, prefs, gyms);
        climbKindStorage.write(climbKindOf(next, gyms));
        onChange(next);
      }}
      className="log-session-control"
      style={{ ...selectStyle, ...style }}
    >
      {(["boulder", "route"] as const).map((d) => (
        <option key={d} value={d}>
          {disciplineLabel(d)}
        </option>
      ))}
      <option value="endurance">{t("endurance.title")}</option>
      {gyms.map((g) => (
        <option key={g.id} value={g.id}>
          {t("logSession.gymCircuits", { gym: g.name })}
        </option>
      ))}
    </select>
  );
}

export type ClimbGradeSelectProps = {
  id?: string;
  climb: ClimbDraft;
  gyms: readonly Gym[];
  style?: React.CSSProperties;
  onChange: (climb: ClimbDraft) => void;
};

/** The grade ladder of the climb's scale, or the circuits of the gym it is at. */
export function ClimbGradeSelect({
  id,
  climb,
  gyms,
  style,
  onChange,
}: ClimbGradeSelectProps): React.ReactElement {
  const gym = gymOfCircuit(gyms, climb.circuit?.id);
  if (gym === null) {
    return (
      <select
        id={id}
        name="grade"
        value={climb.grade}
        onChange={(e) => onChange({ ...climb, grade: e.target.value })}
        className="log-session-control"
        style={{ ...gradeStyle, ...style }}
      >
        {gradeOptions(climb.scale).map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>
    );
  }
  return (
    <select
      id={id}
      name="circuit"
      value={climb.circuit?.id}
      onChange={(e) => {
        const circuit = gym.circuits.find((c) => c.id === e.target.value);
        if (circuit !== undefined) onChange(withCircuit(climb, circuit, gym));
      }}
      className="log-session-control"
      style={{ ...selectStyle, fontWeight: 600, ...style }}
    >
      {gym.circuits.map((c) => (
        <option key={c.id} value={c.id}>
          {`${circuitLabel(c)} · ${circuitRangeLabel(c, gym.scale)}`}
        </option>
      ))}
    </select>
  );
}
