import React from "react";
import { disciplineLabel, type Discipline } from "@sendtally/features/log-session";
import { t } from "@sendtally/features/i18n";
import { Segmented } from "../../components/Segmented";

const OPTIONS = (): Array<{ value: Discipline; label: string }> =>
  (["boulder", "route"] as const).map((value) => ({ value, label: disciplineLabel(value) }));

export function DisciplineToggle({
  value,
  onChange,
}: {
  value: Discipline;
  onChange: (discipline: Discipline) => void;
}): React.ReactElement {
  return (
    <Segmented
      label={t("common.discipline")}
      options={OPTIONS()}
      value={value}
      onChange={onChange}
    />
  );
}
