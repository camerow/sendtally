import React from "react";
import { Link } from "react-router";
import { t } from "@sendtally/features/i18n";
import type { WorkloadLeftOutVM } from "@sendtally/features/statistics";
import { activityPath } from "../../../training/log/paths";

function pathOf({ ref, missing }: WorkloadLeftOutVM): string {
  if (ref.type === "activity") return activityPath(ref.id);
  const session = `/app/sessions/${encodeURIComponent(ref.id)}`;
  return missing === "effort" ? session : `${session}/edit?field=duration`;
}

/** Each record left out of the load, opening the field that would count it. */
export function NotCountedRows({
  label,
  rows,
}: {
  label: string;
  rows: WorkloadLeftOutVM[];
}): React.ReactElement {
  return (
    <>
      <span className="stats-label workload-muted">{label}</span>
      {rows.map((l) => (
        <Link key={`${l.ref.type}${l.ref.id}`} to={pathOf(l)} className="workload-left-row">
          <span className="workload-left-name">{l.ref.name}</span>
          <span className="workload-mono workload-muted">{`${l.detail} ›`}</span>
        </Link>
      ))}
      <span className="workload-mono workload-muted">{t("statistics.workloadOpensRecord")}</span>
    </>
  );
}
