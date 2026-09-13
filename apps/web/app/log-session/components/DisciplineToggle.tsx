import React from "react";
import { DISCIPLINE_LABELS, type Discipline } from "@sendtally/features/log-session";
import { Segmented } from "../../components/Segmented";

const OPTIONS = (["boulder", "route"] as const).map((value) => ({
  value,
  label: DISCIPLINE_LABELS[value].toUpperCase(),
}));

export function DisciplineToggle({
  value,
  onChange,
}: {
  value: Discipline;
  onChange: (discipline: Discipline) => void;
}): React.ReactElement {
  return <Segmented label="Discipline" options={OPTIONS} value={value} onChange={onChange} />;
}
