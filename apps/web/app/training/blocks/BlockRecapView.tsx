import React from "react";
import { Link } from "react-router";
import { changeText, kindLabel } from "@sendtally/features/activities";
import { formatNumber, t } from "@sendtally/features/i18n";
import {
  doneOfShort,
  effortText,
  KIND_LOOK,
  type BlockRecap,
  type WorkoutLookup,
} from "@sendtally/features/training";
import { SummaryTiles } from "../../components/detail/SummaryTiles";
import { BlockWeekBars } from "../components/BlockWeekBars";
import { useHangData } from "../data/HangDataContext";
import { DayMark } from "../plan-week/DayMark";
import { membershipPath } from "./paths";

export type BlockRecapViewProps = { recap: BlockRecap; workout: WorkoutLookup };

/** A block once it is over: what got done, week by week and workout by workout. */
export function BlockRecapView({ recap, workout }: BlockRecapViewProps): React.ReactElement {
  const { model } = useHangData();
  return (
    <>
      <SummaryTiles
        stats={[
          { value: doneOfShort(recap), label: t("plan.done") },
          { value: effortText(recap.effort), label: t("hang.statAvgEffort") },
          { value: formatNumber(recap.missed), label: t("hang.missed") },
        ]}
      />
      <BlockWeekBars weeks={recap.weeks} />
      <div className="block-recap-rows">
        {recap.workouts.map((r) => {
          const w = workout(r.workoutId);
          if (w === undefined) return null;
          const moved = r.change === null ? [] : [changeText(r.change, model.settings.units)];
          const change = [...moved, ...(r.best ? ["★"] : [])].join(" ") || "-";
          return (
            <Link key={r.membershipId} to={membershipPath(r)} className="plan-row plan-row--link">
              <DayMark kind={w.kind} filled />
              <span className="plan-row-text">
                <span className="plan-label-small" style={{ color: KIND_LOOK[w.kind].ink }}>
                  {kindLabel(w.kind)}
                </span>
                <span className="plan-row-name">{w.name}</span>
                <span className="plan-row-meta">
                  {`${t("plan.doneOf", { done: r.done, planned: r.planned })} · ${change}`}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
