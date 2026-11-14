import React from "react";
import { formatDate, t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";
import { ExampleRow } from "./ExampleRow";
import { MenuRow } from "./MenuRow";
import { SectionHeader } from "./SectionHeader";
import type { ExampleRowData, LogEmptyAction } from "./types";

export type LogEmptyProps = {
  /** The preview month's count, such as "2 sessions". */
  count: string;
  examples: readonly ExampleRowData[];
  title: string;
  /** The common way to start; none until it can be started here. */
  primary?: { label: string; onPress: () => void };
  actions: readonly LogEmptyAction[];
};

/**
 * An empty log: a faded month of made-up rows to show what fills it, then the common way to
 * start and the other ways in.
 */
export function LogEmpty({
  count,
  examples,
  title,
  primary,
  actions,
}: LogEmptyProps): React.ReactElement {
  const [now] = React.useState(() => new Date());
  return (
    <div className="log-empty">
      <div className="log-empty-preview" aria-hidden>
        <div className="log-empty-faded">
          <SectionHeader
            title={formatDate(now, { month: "long" })}
            meta={t("sessions.monthMeta", { year: now.getFullYear(), sessions: count })}
          />
          {examples.map((row) => (
            <ExampleRow key={row.title} row={row} now={now} />
          ))}
        </div>
        <span className="log-empty-badge">{t("sessions.example")}</span>
      </div>
      <div className="log-empty-start">
        <h2 className="log-empty-title">{title}</h2>
        {primary !== undefined && (
          <button type="button" className="log-empty-primary" onClick={primary.onPress}>
            <Icon name="plus" size={17} strokeWidth={3} />
            {primary.label}
          </button>
        )}
        <div className="log-empty-actions">
          {actions.map(({ key, ...action }) => (
            <MenuRow key={key} {...action} />
          ))}
        </div>
      </div>
    </div>
  );
}
