import React from "react";
import { View } from "react-native";
import { blockEnd, isLive, liveSchedules, totalSeconds, weekday } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { usePlanItems } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { queries, useQuery } from "@sendtally/features/query";
import { blockMembers, blockWeeks, type TrainingLog } from "@sendtally/features/training";
import { useApi } from "../../../lib/api";
import { BlockCard } from "../blocks/BlockCard";
import { useBlocks } from "../blocks/useBlocks";
import { Button } from "../components/Button";
import { DashedPanel } from "../components/DashedPanel";
import { Label } from "../components/Label";
import { useHangData } from "../data/HangDataContext";
import { PlanGrid } from "./PlanGrid";
import { planGridRows } from "./planGridRows";
import { PlanRows } from "./PlanRows";
import { PlanSheets } from "./PlanSheets";
import type { PlanRequest } from "./types";

/** Train > Plan: live training blocks as cards, then every other live plan as a week grid and a list to edit. */
export function PlanOverview(): React.ReactElement {
  const api = useApi();
  const { model, today } = useHangData();
  const loaded = usePlanItems(api).state;
  const sessions = useQuery(queries.sessions(api)).state;
  const blocks = useBlocks().filter((b) => blockEnd(b) > today);
  const [plan, setPlan] = React.useState<PlanRequest | null>(null);
  const schedules = liveSchedules(model.data.schedules, today);
  const items =
    loaded.status === "ready"
      ? loaded.data.filter((i) => isLive(i, today)).sort((a, b) => a.start.localeCompare(b.start))
      : [];
  const log: TrainingLog = {
    climbs: sessions.status === "ready" ? sessions.data.sessions : [],
    activities: sessions.status === "ready" ? sessions.data.activities : [],
    hangs: model.sessions,
    schedules,
    planItems: items,
  };
  const workoutMinutes = (id: string): number | null => {
    const w = model.workout(id);
    return w === undefined ? null : totalSeconds(w) / 60;
  };
  const inBlock = new Set(blocks.map((b) => b.id));
  const outside = {
    schedules: schedules.filter((s) => !inBlock.has(s.blockId ?? "")),
    items: items.filter((i) => !inBlock.has(i.blockId ?? "")),
  };
  const rows = planGridRows(outside.schedules, outside.items, model);
  const nothing = rows.length === 0 && blocks.length === 0;

  return (
    <View style={{ gap: 16 }}>
      {blocks.map((block) => {
        const members = blockMembers(block, items, schedules);
        return (
          <BlockCard
            key={block.id}
            block={block}
            members={members}
            weeks={blockWeeks(block, members, log, workoutMinutes, today)}
            onPlan={setPlan}
          />
        );
      })}
      {nothing && <DashedPanel body={t("plan.empty")} />}
      {rows.length > 0 && (
        <View style={{ gap: 8 }}>
          {blocks.length > 0 && (
            <Label color={colors.textSecondary}>{t("plan.outsideBlocks")}</Label>
          )}
          <PlanGrid rows={rows} />
          <PlanRows schedules={outside.schedules} items={outside.items} onPlan={setPlan} />
        </View>
      )}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button
          label={t("plan.planTraining")}
          onPress={() => setPlan({ mode: "choose", days: [weekday(today)], start: today })}
          variant="dashed"
          icon="plus"
          height={50}
          style={{ flex: 1 }}
        />
        <Button
          label={t("plan.newBlock")}
          onPress={() => setPlan({ mode: "block", block: null })}
          variant="dashed"
          icon="plus"
          height={50}
          style={{ flex: 1 }}
        />
      </View>
      <PlanSheets request={plan} onChange={setPlan} />
    </View>
  );
}
