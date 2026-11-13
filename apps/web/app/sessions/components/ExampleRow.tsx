import React from "react";
import { sessionDay } from "@sendtally/features/sessions";
import { Icon } from "../../components/Icon";
import { DayColumn } from "./DayColumn";
import { rowClass } from "./rowClass";
import type { ExampleRowData } from "./types";

/** A log row drawn from made-up data, laid out as the real session rows are. */
export function ExampleRow({ row, now }: { row: ExampleRowData; now: Date }): React.ReactElement {
  const at = new Date(now.getTime() - row.daysAgo * 86_400_000).toISOString();
  const { weekday, day } = sessionDay({ start_at: at });
  return (
    <div className={rowClass(false, true, false)}>
      <DayColumn weekday={weekday} day={day} />
      <span className="log-row-main">
        <span className="log-row-title">
          <span className="log-row-title-text">{row.title}</span>
        </span>
        <span className="log-row-meta">{row.meta}</span>
      </span>
      <span className="log-row-chevron">
        <Icon name="chevron" size={12} strokeWidth={2} />
      </span>
    </div>
  );
}
