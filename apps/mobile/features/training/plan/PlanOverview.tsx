import React from "react";
import { View } from "react-native";
import { blockEnd } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { blockMembers, blockWeeks, useTrainingLog } from "@sendtally/features/training";
import { useApi } from "../../../lib/api";
import { BlockCard } from "../blocks/BlockCard";
import { DashedPanel } from "../components/DashedPanel";
import { Label } from "../components/Label";
import { useHangData } from "../data/HangDataContext";
import { PlanGrid } from "./PlanGrid";
import { liveMembers, planGridRows } from "./planGridRows";
import { PlanRows } from "./PlanRows";

/** Train > Plan: live training blocks as cards, then every other plan as a week grid and a list. */
export function PlanOverview(): React.ReactElement {
  const { today } = useHangData();
  const { log } = useTrainingLog(useApi());
  const { plan, workout } = log;
  const blocks = plan.blocks.filter((b) => blockEnd(b) > today);
  const outside = liveMembers(plan, today).filter((m) => m.blockId === null);
  const rows = planGridRows(outside, workout);
  const nothing = rows.length === 0 && blocks.length === 0;

  return (
    <View style={{ gap: 16 }}>
      {blocks.map((block) => (
        <BlockCard
          key={block.id}
          block={block}
          plan={plan}
          members={blockMembers(plan, block)}
          workout={workout}
          weeks={blockWeeks(block, log, today)}
        />
      ))}
      {nothing && <DashedPanel body={t("plan.empty")} />}
      {rows.length > 0 && (
        <View style={{ gap: 8 }}>
          {blocks.length > 0 && (
            <Label color={colors.textSecondary}>{t("plan.outsideBlocks")}</Label>
          )}
          <PlanGrid rows={rows} />
          <PlanRows plan={plan} members={outside} workout={workout} />
        </View>
      )}
    </View>
  );
}
