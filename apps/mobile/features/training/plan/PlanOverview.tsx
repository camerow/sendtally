import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import { blockEnd } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { blockMembers, useTrainingLog } from "@sendtally/features/training";
import { useApi } from "../../../lib/api";
import { BlockCard } from "../blocks/BlockCard";
import { Button } from "../components/Button";
import { DashedPanel } from "../components/DashedPanel";
import { Label } from "../components/Label";
import { useHangData } from "../data/HangDataContext";
import { PlanGrid } from "./PlanGrid";
import { liveMembers, planGridRows } from "./planGridRows";

const LIT_MS = 2500;

export type PlanOverviewProps = {
  /** A plan just added, lit for a moment. */
  highlight: string | null;
};

/**
 * Train > Plan: adding to it, live training blocks as cards, then every other plan as a
 * week grid.
 */
export function PlanOverview({ highlight }: PlanOverviewProps): React.ReactElement {
  const [lit, setLit] = React.useState(highlight);
  React.useEffect(() => {
    const timer = setTimeout(() => setLit(null), LIT_MS);
    return () => clearTimeout(timer);
  }, []);
  const { today } = useHangData();
  const { log } = useTrainingLog(useApi());
  const { plan, workout } = log;
  const blocks = plan.blocks.filter((b) => blockEnd(b) > today);
  const outside = liveMembers(plan, today).filter((m) => m.blockId === null);
  const rows = planGridRows(outside, workout);
  const nothing = rows.length === 0 && blocks.length === 0;

  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button
          label={t("plan.addToPlan")}
          onPress={() => router.push("/plan/add")}
          variant="primary"
          icon="plus"
          height={46}
          style={{ flex: 1 }}
        />
        <Button
          label={t("plan.newBlock")}
          onPress={() => router.push("/plan/block/new")}
          variant="outline"
          height={46}
          style={{ flex: 1 }}
        />
      </View>
      {blocks.map((block) => (
        <BlockCard
          key={block.id}
          block={block}
          members={blockMembers(plan, block)}
          workout={workout}
          highlight={lit}
        />
      ))}
      {nothing && <DashedPanel body={t("plan.empty")} />}
      {rows.length > 0 && (
        <View style={{ gap: 8 }}>
          {blocks.length > 0 && (
            <Label color={colors.textSecondary}>{t("plan.outsideBlocks")}</Label>
          )}
          <PlanGrid rows={rows} highlight={lit} />
        </View>
      )}
    </View>
  );
}
