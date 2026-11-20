import React from "react";
import { clock, type SessionItem } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import type { Tally } from "@sendtally/features/log-session";
import type { ClimbPlan, ClimbRow } from "@sendtally/features/workouts";
import type { MoreMenuItem } from "../../components/MoreMenu";
import type { About } from "../components/AboutButton";
import { ExerciseCardHead } from "../players/ExerciseCardHead";
import { RestPreview } from "../players/RestPreview";
import { ClimbChip } from "./ClimbChip";
import { GradePicker } from "./GradePicker";

export type ClimbCardProps = {
  item: SessionItem;
  plan: ClimbPlan;
  rows: readonly ClimbRow[];
  /** The tally, while it is on this card; its current set takes the grades picked. */
  tally: Tally | null;
  /** The rest a set's end started, under it while it runs. */
  restUnder: (set: number) => React.ReactNode;
  about?: About | undefined;
  onFold: () => void;
  menu: readonly MoreMenuItem[];
  onFlip: (key: string) => void;
  onEdit: (key: string) => void;
};

const column = (plan: ClimbPlan): string =>
  plan.onS !== undefined
    ? t("workouts.onTheWallFor", { time: clock(plan.onS) })
    : plan.climbs !== undefined
      ? t("workouts.climbsPerSet", { n: plan.climbs })
      : t("workouts.climbsColumn");

/** A climbing exercise as set rows: each set's climbs as chips, and the grades under the one being climbed. */
export function ClimbCard({
  item,
  plan,
  rows,
  tally,
  restUnder,
  about,
  onFold,
  menu,
  onFlip,
  onEdit,
}: ClimbCardProps): React.ReactElement {
  const restS = item.dose.setRestS ?? 0;
  const open = plan.climbs === undefined && plan.onS === undefined;
  return (
    <section className="player-card">
      <ExerciseCardHead item={item} about={about} onFold={onFold} menu={menu} />
      <div className="climb-row climb-row--head" aria-hidden="true">
        <span className="climb-col train-label climb-col-set">{t("activities.colSet")}</span>
        <span className="climb-col train-label">{column(plan)}</span>
      </div>
      {rows.map((row, i) => {
        const current = tally !== null && row.state === "current";
        return (
          <React.Fragment key={row.set}>
            <div
              className={`climb-row climb-row--${row.state}${current ? " climb-row--current" : ""}`}
            >
              {current && row.fill !== null && (
                <span className="climb-fill" style={{ width: `${row.fill * 100}%` }} />
              )}
              <span className="climb-set">{row.set}</span>
              <span className="climb-chips">
                {row.climbs.map((c) => (
                  <ClimbChip
                    key={c.key}
                    climb={c}
                    onFlip={() => onFlip(c.key)}
                    onEdit={() => onEdit(c.key)}
                  />
                ))}
              </span>
              {row.note !== "" && <span className="climb-note">{row.note}</span>}
              <label className="set-tick">
                <input
                  type="checkbox"
                  checked={row.state === "done"}
                  aria-disabled={!(open && current)}
                  onChange={() => {
                    if (open && current) tally.endSet();
                  }}
                  aria-label={t("workouts.endSet", { set: row.set })}
                />
              </label>
            </div>
            {current && <GradePicker tally={tally} />}
            {restUnder(row.set - 1) ||
              (i < rows.length - 1 && restS > 0 && <RestPreview seconds={restS} />)}
          </React.Fragment>
        );
      })}
    </section>
  );
}
