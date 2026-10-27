import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { shortDate } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { blockDone, blockGroups, blockMembers, useTrainingLog } from "@sendtally/features/training";
import { useApi } from "../../../lib/api";
import { BlockCard } from "../blocks/BlockCard";
import { DashedPanel } from "../components/DashedPanel";
import { Label } from "../components/Label";
import { useHangData } from "../data/HangDataContext";
import { PlanGrid } from "../plan/PlanGrid";
import { liveMembers, planGridRows } from "../plan/planGridRows";
import { BlockRow } from "./BlockRow";

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <View style={{ gap: 4 }}>
      <Label color={colors.textSecondary}>{label}</Label>
      {children}
    </View>
  );
}

/** Train > Blocks: the running block on top, then plans with no block, then upcoming and past blocks. */
export function BlocksList(): React.ReactElement {
  const { today } = useHangData();
  const { log } = useTrainingLog(useApi());
  const { plan, workout } = log;
  const { current, upcoming, past } = blockGroups(plan.blocks, today);
  const ongoing = planGridRows(
    liveMembers(plan, today).filter((m) => m.blockId === null),
    workout
  );
  const weeks = (n: number): string => t("calendar.weeks", { count: n });
  const nothing = plan.blocks.length === 0 && ongoing.length === 0;

  return (
    <View style={{ gap: 20 }}>
      {current.map((block) => (
        <BlockCard
          key={block.id}
          block={block}
          members={blockMembers(plan, block)}
          workout={workout}
        />
      ))}
      {nothing && <DashedPanel body={t("plan.empty")} />}
      {ongoing.length > 0 && (
        <Group label={t("plan.ongoing")}>
          <PlanGrid rows={ongoing} />
        </Group>
      )}
      {upcoming.length > 0 && (
        <Group label={t("plan.upcoming")}>
          {upcoming.map((b) => (
            <BlockRow
              key={b.id}
              id={b.id}
              name={b.name}
              meta={`${t("plan.startsOn", { date: shortDate(b.start) })} · ${weeks(b.weeks)}`}
            />
          ))}
        </Group>
      )}
      {past.length > 0 && (
        <Group label={t("plan.past")}>
          {past.map((b) => {
            const done = blockDone(log, b, today);
            const meta = [weeks(b.weeks), ...(done.planned > 0 ? [t("plan.doneOf", done)] : [])];
            return <BlockRow key={b.id} id={b.id} name={b.name} meta={meta.join(" · ")} />;
          })}
        </Group>
      )}
    </View>
  );
}
