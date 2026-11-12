import React from "react";
import type { HangHistoryRow } from "@sendtally/api-client";
import { t } from "@sendtally/features/i18n";
import {
  hangAt,
  hangEffortLabel,
  hangMetaLabel,
  hangTitle,
  sessionDay,
} from "@sendtally/features/sessions";
import { StravaMark } from "../../components/StravaMark";
import { DayColumn } from "./DayColumn";
import { rowClass } from "./rowClass";

/** A hangboard session in the log, laid out like a session row. It opens nowhere on the web yet. */
export function HangRow({
  hang,
  inset = false,
  divider = true,
  blockTag,
}: {
  hang: HangHistoryRow;
  inset?: boolean;
  divider?: boolean;
  blockTag?: string;
}): React.ReactElement {
  const { weekday, day } = sessionDay({ start_at: hangAt(hang) });
  const title = hangTitle(hang);
  const meta = hangMetaLabel(hang);
  const effort = hangEffortLabel(hang);
  const onStrava = hang.stravaActivityId !== null;
  return (
    <div
      role="group"
      aria-label={[
        title,
        `${weekday} ${day}`,
        meta,
        blockTag ?? null,
        effort,
        onStrava ? t("sessions.postedToStrava") : null,
      ]
        .filter((part) => part !== null)
        .join(", ")}
      className={rowClass(inset, divider, false)}
    >
      <DayColumn weekday={weekday} day={day} />
      <span className="log-row-main">
        <span className="log-row-title">
          <span className="log-row-title-text">{title}</span>
          {onStrava && <StravaMark />}
        </span>
        <span className="log-row-meta">{meta}</span>
        {blockTag !== undefined && <span className="log-row-meta">{blockTag}</span>}
      </span>
      {effort !== null && <span className="log-row-effort">{effort}</span>}
    </div>
  );
}
