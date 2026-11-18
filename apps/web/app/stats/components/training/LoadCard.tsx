import React from "react";
import { t } from "@sendtally/features/i18n";
import type { LoadVM } from "@sendtally/features/statistics";
import { CardRow } from "./CardRow";
import { LoadChart } from "./LoadChart";
import { NotCountedSheet } from "./NotCountedSheet";

/** Load over the range: an average week a bar, the average over the range, and what was left out. */
export function LoadCard({ load }: { load: LoadVM }): React.ReactElement {
  const [hit, setHit] = React.useState<number | null>(null);
  const [open, setOpen] = React.useState(false);
  const bar = hit === null ? null : (load.bars[hit] ?? null);

  return (
    <section className="stats-card stats-wide workload-card">
      <div className="stats-card-head">
        <h2 className="stats-label">{t("statistics.loadTitle")}</h2>
        <span className="stats-meta">{load.caption}</span>
      </div>
      {load.state === "none" ? (
        <span className="workload-headline workload-faint">{load.headline}</span>
      ) : (
        <div className="load-head" aria-live="polite">
          <span className={bar === null ? "workload-ratio" : "workload-ratio load-touched"}>
            {bar?.text ?? load.headline}
          </span>
          {bar === null && <span className="workload-mono workload-muted">{load.unit}</span>}
        </div>
      )}
      {bar !== null ? (
        <p className="workload-mono load-readout">{bar.readout}</p>
      ) : load.sentence !== null ? (
        <p className="workload-sentence">{load.sentence}</p>
      ) : null}
      <LoadChart load={load} hit={hit} onHit={setHit} />
      {load.note !== null && <p className="workload-mono workload-muted load-note">{load.note}</p>}
      {load.leftOutLine !== null && (
        <div>
          <CardRow onClick={() => setOpen(true)}>{load.leftOutLine}</CardRow>
        </div>
      )}
      <NotCountedSheet rows={load.leftOut} open={open} onClose={() => setOpen(false)} />
    </section>
  );
}
