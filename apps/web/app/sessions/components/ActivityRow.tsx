import React from "react";
import { Link } from "react-router";
import { activityPath } from "../../training/log/paths";
import type { Activity } from "@sendtally/api-client";
import { activityAt, activityEffortLabel, activityMetaLabel } from "@sendtally/features/activities";
import { sessionDay } from "@sendtally/features/sessions";
import { DayColumn } from "./DayColumn";
import { rowClass } from "./rowClass";

/** A strength, mobility, run or other session in the log. It opens its page. */
export function ActivityRow({
  activity,
  inset = false,
  divider = true,
  blockTag,
}: {
  activity: Activity;
  inset?: boolean;
  divider?: boolean;
  blockTag?: string;
}): React.ReactElement {
  const { weekday, day } = sessionDay({ start_at: activityAt(activity) });
  const meta = activityMetaLabel(activity);
  const effort = activityEffortLabel(activity);
  return (
    <Link
      to={activityPath(activity.id)}
      aria-label={[activity.title, `${weekday} ${day}`, meta, blockTag ?? null, effort]
        .filter((part) => part !== null)
        .join(", ")}
      className={rowClass(inset, divider, false)}
    >
      <DayColumn weekday={weekday} day={day} />
      <span className="log-row-main">
        <span className="log-row-title">
          <span className="log-row-title-text">{activity.title}</span>
        </span>
        <span className="log-row-meta">{meta}</span>
        {blockTag !== undefined && <span className="log-row-meta">{blockTag}</span>}
      </span>
      {effort !== null && <span className="log-row-effort">{effort}</span>}
    </Link>
  );
}
