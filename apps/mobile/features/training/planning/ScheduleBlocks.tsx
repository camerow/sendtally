import React from "react";
import { View } from "react-native";
import type { Block } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import {
  blockGroups,
  pastMeta,
  templateMeta,
  useTrainingLog,
  blockName,
} from "@sendtally/features/training";
import { useApi } from "../../../lib/api";
import { DashedPanel } from "../components/DashedPanel";
import { Label } from "../components/Label";
import { useHangData } from "../data/HangDataContext";
import { BlockRow } from "../train/BlockRow";

export type ScheduleBlocksProps = { onPick: (block: Block) => void };

/** What can be scheduled as a block: templates, and past blocks to run again. Running and upcoming ones already are. */
export function ScheduleBlocks({ onPick }: ScheduleBlocksProps): React.ReactElement {
  const { today } = useHangData();
  const { log } = useTrainingLog(useApi());
  const { templates, past } = blockGroups(log.plan.blocks, today);
  const groups = [
    {
      label: t("plan.templates"),
      rows: templates.map((block) => ({ block, meta: templateMeta(log, block) })),
    },
    {
      label: t("plan.completed"),
      rows: past.map((block) => ({ block, meta: pastMeta(log, block, today) })),
    },
  ].filter((g) => g.rows.length > 0);
  if (groups.length === 0) return <DashedPanel body={t("plan.noBlocksToSchedule")} />;
  return (
    <View style={{ gap: 20 }}>
      {groups.map((g) => (
        <View key={g.label} style={{ gap: 4 }}>
          <Label color={colors.textSecondary}>{g.label}</Label>
          {g.rows.map(({ block, meta }) => (
            <BlockRow
              key={block.id}
              id={block.id}
              back={t("plan.tab")}
              name={blockName(block)}
              meta={meta}
              onPress={() => onPick(block)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
