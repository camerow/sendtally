import React from "react";
import type { DatedBlock } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { blockDateRange } from "@sendtally/features/training";

function RadioRow({
  title,
  sub,
  on,
  onPick,
}: {
  title: string;
  sub: string;
  on: boolean;
  onPick: () => void;
}): React.ReactElement {
  return (
    <label className="radio-row">
      <input type="radio" name="schedule-block" checked={on} onChange={onPick} />
      <span className="radio-row-text">
        <span className="plan-row-name">{title}</span>
        <span className="plan-row-meta">{sub}</span>
      </span>
    </label>
  );
}

/** Which running block a plan goes in, or none. */
export function BlockChoice({
  blocks,
  value,
  onChange,
}: {
  blocks: readonly DatedBlock[];
  value: string | null;
  onChange: (blockId: string | null) => void;
}): React.ReactElement {
  return (
    <section className="schedule-section">
      <h2 className="plan-label plan-label--muted">{t("plan.block")}</h2>
      <div>
        {blocks.map((b) => (
          <RadioRow
            key={b.id}
            title={b.name}
            sub={blockDateRange(b)}
            on={value === b.id}
            onPick={() => onChange(b.id)}
          />
        ))}
        <RadioRow
          title={t("plan.noBlock")}
          sub={t("plan.noBlockHint")}
          on={value === null}
          onPick={() => onChange(null)}
        />
      </div>
    </section>
  );
}
