import React from "react";
import { useNavigate } from "react-router";
import type { GradeClimbTarget, GradeClimbsVM } from "@sendtally/features/climbs";
import { t } from "@sendtally/features/i18n";
import { ClimbLogRow } from "../../climbs/components/ClimbLogRow";
import { GradeBadge } from "../../climbs/components/GradeBadge";
import { ExpandableRow } from "../../components/ExpandableRow";

/** Where a climb in the list opens; an activity has no page on the web yet, so its row is plain. */
export function gradeClimbHref(target: GradeClimbTarget | null): string | null {
  if (target === null || target.kind === "activity") return null;
  const id = encodeURIComponent(target.id);
  return target.kind === "climb" ? `/app/log/climbs/${id}` : `/app/sessions/${id}`;
}

/** Every grade tried with how many went; one grade at a time opens in place to list its climbs. */
export function ClimbsByGrade({
  grades,
}: {
  grades: readonly GradeClimbsVM[];
}): React.ReactElement {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState<string | null>(null);
  const total = grades.reduce(
    (n, g) => n + g.climbs.reduce((m, c) => m + (c.row.count ?? 1), 0),
    0
  );
  return (
    <section className="stats-card climbs-by-grade">
      <div className="stats-card-head">
        <h2 className="stats-label">{t("climbs.climbsByGrade")}</h2>
        <span className="stats-meta">{t("common.climbCount", { count: total })}</span>
      </div>
      <div>
        {grades.map((g) => {
          const expanded = g.key === open;
          return (
            <ExpandableRow
              key={g.key}
              expanded={expanded}
              onToggle={() => setOpen(expanded ? null : g.key)}
              label={`${g.gradeLabel}, ${g.split}`}
              indent={64}
              body={g.climbs.map((c) => {
                const href = gradeClimbHref(c.target);
                return (
                  <ClimbLogRow
                    key={c.key}
                    row={c.row}
                    showGrade={false}
                    onPress={href === null ? null : () => void navigate(href)}
                  />
                );
              })}
            >
              <GradeBadge label={g.gradeLabel} onSoft={expanded} />
              <span className="climbs-by-grade-split">{g.split}</span>
            </ExpandableRow>
          );
        })}
      </div>
    </section>
  );
}
