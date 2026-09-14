import React from "react";
import { Link } from "react-router";
import {
  climbGradeLabel,
  dateLabel,
  disciplineLabel,
  projectMetaLabel,
  projectStatus,
  type ProjectListItem,
} from "@sendtally/features/climbs";
import { t } from "@sendtally/features/i18n";

const MAX_SPARK_BARS = 6;

function metaLabel({ climb }: ProjectListItem): string {
  if (climb.sessions === 0) {
    return t("projects.rowMetaNew", {
      discipline: disciplineLabel(climb),
      date: dateLabel(climb.first_at),
    });
  }
  const vars = { meta: projectMetaLabel(climb), date: dateLabel(climb.last_at) };
  return t(projectStatus(climb) === "sent" ? "projects.rowMetaSent" : "projects.rowMetaLast", vars);
}

export function ProjectRow({ item }: { item: ProjectListItem }): React.ReactElement {
  const { climb, bars } = item;
  const sent = projectStatus(climb) === "sent";
  const spark = bars.slice(-MAX_SPARK_BARS);

  return (
    <Link to={`/app/projects/${climb.slug}`} className="project-row">
      <span
        className={climb.grade === null ? "project-grade project-grade--none" : "project-grade"}
      >
        {climb.grade === null ? "–" : climbGradeLabel(climb)}
      </span>
      <span className="project-main">
        <span className="project-name">{climb.name}</span>
        <span className="project-meta">{metaLabel(item)}</span>
      </span>
      {sent || spark.length === 0 ? (
        <span className="project-sent-at">
          {sent ? t("projects.sentOn", { date: dateLabel(climb.last_at) }) : ""}
        </span>
      ) : (
        <span className="project-spark">
          <span className="project-spark-bars">
            {spark.map((bar, i) => (
              <span
                key={i}
                className={
                  bar.peak ? "project-spark-bar project-spark-bar--peak" : "project-spark-bar"
                }
                style={{ height: Math.max(4, Math.round(bar.height * 26)) }}
              />
            ))}
          </span>
          <span className="project-spark-label">{t("projects.attemptsPerSessionShort")}</span>
        </span>
      )}
      <span className={sent ? "project-status project-status--sent" : "project-status"}>
        {t(sent ? "common.sent" : "projects.statusOpen")}
      </span>
      <span className="project-chevron">›</span>
    </Link>
  );
}
