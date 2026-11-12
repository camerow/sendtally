import React from "react";
import type { HistoryItem } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { HistoryRow } from "./HistoryRow";
import { SectionHeading } from "./SectionHeading";

const SHOWN = 5;

export type HistoryListProps = {
  items: readonly HistoryItem[];
  /** Where a row opens. */
  to: (id: string) => string;
  title?: string;
  onAdd?: { label: string; onPress: () => void };
};

/** Past sessions, newest first: five, then the rest on asking. Left out when there is none but this one, unless it has an add button. */
export function HistoryList({
  items,
  to,
  title,
  onAdd,
}: HistoryListProps): React.ReactElement | null {
  const [all, setAll] = React.useState(false);
  if (onAdd === undefined && items.every((i) => i.current === true)) return null;
  const shown = all ? items : items.slice(0, SHOWN);
  return (
    <section className="detail-section">
      <SectionHeading
        title={
          title ??
          t("hang.history", {
            count: t("hang.sessionCount", {
              count: items.filter((i) => i.kind !== "note").length,
            }),
          })
        }
        add={onAdd}
      />
      {shown.map((item) => (
        <HistoryRow key={item.id} item={item} to={to(item.id)} />
      ))}
      {items.length > SHOWN && (
        <button type="button" className="detail-more" onClick={() => setAll(!all)}>
          {all ? t("hang.showFewer") : t("hang.showAll", { n: items.length })}
        </button>
      )}
    </section>
  );
}
