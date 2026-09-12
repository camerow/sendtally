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

const MAX_SPARK_BARS = 6;

function metaLabel({ climb }: ProjectListItem): string {
  if (climb.sessions === 0) {
    return `${disciplineLabel(climb)} · ADDED ${dateLabel(climb.first_at)} · NOT TRIED YET`;
  }
  const when =
    projectStatus(climb) === "sent"
      ? `SENT ${dateLabel(climb.last_at)}`
      : `LAST ${dateLabel(climb.last_at)}`;
  return `${projectMetaLabel(climb)} · ${when}`;
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
        <span className="project-sent-at">{sent ? `SENT ${dateLabel(climb.last_at)}` : ""}</span>
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
          <span className="project-spark-label">ATTEMPTS / SESSION</span>
        </span>
      )}
      <span className={sent ? "project-status project-status--sent" : "project-status"}>
        {sent ? "SENT" : "OPEN"}
      </span>
      <span className="project-chevron">›</span>
    </Link>
  );
}
