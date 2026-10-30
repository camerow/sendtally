import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import { kindLabel } from "@sendtally/features/activities";
import { formatNumber, t } from "@sendtally/features/i18n";
import type { BlockRecap, WorkoutLookup } from "@sendtally/features/training";
import { BlockWeekBars } from "../blocks/BlockWeekBars";
import { doneOfShort, effortText } from "../blocks/blockText";
import { PlanRow } from "../components/PlanRow";
import { useHangData } from "../data/HangDataContext";
import { SummaryTiles } from "../summary/SummaryTiles";
import { changeText } from "../summary/summaryText";
import { DayMark } from "../today/DayMark";
import { KIND_LOOK } from "../today/kindLook";

export type BlockRecapViewProps = { recap: BlockRecap; workout: WorkoutLookup };

/** A block once it is over: what got done, week by week and and workout by workout. */
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
      <View style={{ gap: 8 }}>
        {recap.workouts.map((r) => {
          const w = workout(r.workoutId);
          if (w === undefined) return null;
          const moved = r.change === null ? [] : [changeText(r.change, model.settings.units)];
          const change = [...moved, ...(r.best ? ["★"] : [])].join(" ") || "-";
          return (
            <PlanRow
              key={r.membershipId}
              mark={<DayMark kind={w.kind} filled />}
              tag={kindLabel(w.kind)}
              tagColor={KIND_LOOK[w.kind].ink}
              name={w.name}
              meta={`${t("plan.doneOf", { done: r.done, planned: r.planned })} · ${change}`}
              onOpen={() => router.push({ pathname: "/workout/[id]", params: { id: w.id } })}
            />
          );
        })}
      </View>
    </>
  );
}
