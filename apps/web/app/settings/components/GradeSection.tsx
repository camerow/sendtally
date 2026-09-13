import React from "react";
import {
  DISCIPLINE_LABELS,
  GRADE_SCALE_OPTIONS,
  scaleOptionsFor,
  type Discipline,
  type GradePrefs,
  type GradeScale,
} from "@sendtally/features/log-session";
import { Segmented } from "../../components/Segmented";
import { bodyText, rowDivider, sectionLabel } from "./styles";

function scaleLabel(scale: GradeScale): string {
  return GRADE_SCALE_OPTIONS.find((o) => o.value === scale)?.label ?? scale.toUpperCase();
}

function Row({
  discipline,
  prefs,
  onChange,
}: {
  discipline: Discipline;
  prefs: GradePrefs;
  onChange: (discipline: Discipline, scale: GradeScale) => void;
}): React.ReactElement {
  const options = scaleOptionsFor(discipline).map((scale) => ({
    value: scale,
    label: scaleLabel(scale),
  }));
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
        minHeight: 44,
      }}
    >
      <span style={{ fontWeight: 600, fontSize: 13 }}>{DISCIPLINE_LABELS[discipline]}</span>
      <Segmented
        label={DISCIPLINE_LABELS[discipline]}
        options={options}
        value={prefs[discipline]}
        onChange={(scale) => onChange(discipline, scale)}
      />
    </div>
  );
}

export function GradeSection({
  prefs,
  onChange,
}: {
  prefs: GradePrefs;
  onChange: (discipline: Discipline, scale: GradeScale) => void;
}): React.ReactElement {
  return (
    <>
      <span style={sectionLabel}>GRADES</span>
      <p style={bodyText}>
        The scale you log in. Climbs you have already logged keep the scale they were entered in.
      </p>
      <Row discipline="boulder" prefs={prefs} onChange={onChange} />
      <div style={rowDivider} />
      <Row discipline="route" prefs={prefs} onChange={onChange} />
    </>
  );
}
