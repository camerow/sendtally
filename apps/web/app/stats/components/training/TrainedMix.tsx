import React from "react";
import { t } from "@sendtally/features/i18n";
import {
  focusColor,
  focusKey,
  type TrainedBy,
  type TrainedFocusVM,
  type TrainedKindVM,
} from "@sendtally/features/statistics";
import { KIND_COLORS } from "@sendtally/features/training";
import { Icon } from "../../../components/Icon";
import { Segmented } from "../../../components/Segmented";

export type TrainedMixProps = {
  trained: TrainedKindVM[];
  byFocus: TrainedFocusVM[];
  total: string;
  by: TrainedBy;
  onBy: (by: TrainedBy) => void;
  /** The legend row picked to narrow the workouts, by its key. */
  picked: string | null;
  onPick: (key: string | null) => void;
};

/** What you trained, by category or by focus: one stacked bar by sessions, then each one's sessions and time; a row picks itself as a filter. */
export function TrainedMix({
  trained,
  byFocus,
  total,
  by,
  onBy,
  picked,
  onPick,
}: TrainedMixProps): React.ReactElement {
  const rows =
    by === "category"
      ? trained.map((k) => ({ ...k, key: k.kind, color: KIND_COLORS[k.kind] }))
      : byFocus.map((f) => ({ ...f, key: focusKey(f.focus), color: focusColor(f.focus) }));
  return (
    <section className="stats-card">
      <div className="stats-card-head">
        <h2 className="stats-label">{t("statistics.whatYouTrained")}</h2>
        <span className="stats-meta">{total}</span>
      </div>
      <Segmented<TrainedBy>
        soft
        label={t("statistics.whatYouTrained")}
        value={by}
        onChange={onBy}
        options={[
          { value: "category", label: t("workouts.category") },
          { value: "focus", label: t("focus.label") },
        ]}
      />
      <div className="mix-bar" aria-hidden="true">
        {rows.map((r) => (
          <span
            key={r.key}
            style={{
              flex: r.share,
              background: r.color,
              opacity: picked === null || picked === r.key ? 1 : 0.25,
            }}
          />
        ))}
      </div>
      <div>
        {rows.map((r) => {
          const on = picked === r.key;
          return (
            <button
              key={r.key}
              type="button"
              aria-pressed={on}
              aria-label={`${r.name}, ${r.detail}`}
              className={on ? "mix-row mix-row--on" : "mix-row"}
              style={{ opacity: picked === null || on ? 1 : 0.45 }}
              onClick={() => onPick(on ? null : r.key)}
            >
              <span className="mix-row-name">
                <span className="mix-row-swatch" style={{ background: r.color }} />
                {r.name}
                {on && <Icon name="check" size={14} />}
              </span>
              <span className="stats-meta">{r.detail}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
