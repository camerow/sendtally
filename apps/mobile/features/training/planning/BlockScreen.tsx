import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { blockEnd, isDated } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { blockMembers, blockRecap, usePlan, useTrainingLog } from "@sendtally/features/training";
import { ScreenFrame } from "../../../components/ScreenFrame";
import { useApi } from "../../../lib/api";
import { blockDates } from "../blocks/blockText";
import { Button } from "../components/Button";
import { DetailActions } from "../components/DetailActions";
import { deleteRow } from "../components/deleteRow";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { usePlanActions } from "../plan/usePlanActions";
import { useLit } from "../plan/useLit";
import { type } from "../type";
import { BlockWeekChips } from "../blocks/BlockWeekChips";
import { BlockOverview } from "./BlockOverview";
import { BlockRecapView } from "./BlockRecapView";
import { BlockWeek } from "./BlockWeek";
import { PlanAgainSheet } from "./PlanAgainSheet";

export type BlockScreenProps = {
  id: string;
  /** A plan just added, lit for a moment. */
  highlight?: string;
  /** Where back goes, as that screen is called; plain Back without it. */
  back?: string;
};

/**
 * One block, read only: how it is going while it runs, a recap and Plan again once it is over,
 * and for a template its weeks with Schedule. Edit changes it.
 */
export function BlockScreen({ id, highlight, back }: BlockScreenProps): React.ReactElement | null {
  const lit = useLit(highlight);
  const { today } = useHangData();
  const api = useApi();
  const plan = usePlan(api);
  const { log } = useTrainingLog(api);
  const actions = usePlanActions();
  const [again, setAgain] = React.useState(false);
  if (plan.state.status !== "ready")
    return <LoadState state={plan.state} onRetry={() => void plan.reload()} framed />;
  const block = log.plan.blocks.find((b) => b.id === id);
  if (block === undefined) return null;
  const dated = isDated(block) ? block : null;
  const ended = dated !== null && blockEnd(dated) <= today;
  const members = blockMembers(log.plan, block);
  const saveAsTemplate = async (): Promise<void> => {
    const copy = randomUUID();
    if (await actions.copyBlock(id, copy, null))
      router.push({ pathname: "/plan/block/[id]", params: { id: copy } });
  };

  return (
    <ScreenFrame
      backLabel={back}
      action={
        <DetailActions
          onEdit={() => router.push({ pathname: "/plan/block/edit", params: { id } })}
          menu={[
            {
              icon: "copy",
              title: t("plan.saveAsTemplate"),
              hint: t("plan.saveAsTemplateHint"),
              onPress: () => void saveAsTemplate(),
            },
            deleteRow({
              title: t("plan.deleteBlock"),
              hint: t("plan.deleteBlockBody"),
              confirm: {
                title: t("plan.deleteBlockTitle", { name: block.name }),
                body: t("plan.deleteBlockBody"),
              },
              onDelete: () => void actions.deleteBlock(id),
            }),
          ]}
        />
      }
      footer={
        ended || dated === null ? (
          <Button
            label={dated === null ? t("plan.schedule") : t("plan.planAgain")}
            onPress={() => setAgain(true)}
            variant="primary"
            height={54}
          />
        ) : undefined
      }
    >
      <View style={{ gap: 4 }}>
        {ended && <Label color={colors.fern}>{t("plan.finished")}</Label>}
        {dated === null && <Label color={colors.textSecondary}>{t("plan.template")}</Label>}
        <Title size={34}>{block.name}</Title>
        <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
          {[
            dated === null ? null : blockDates(dated),
            t("calendar.weeks", { count: block.weeks }),
            dated === null ? t("plan.notScheduled") : null,
          ]
            .filter((x) => x !== null)
            .join(" · ")}
        </Text>
      </View>
      {dated === null ? (
        <>
          <BlockWeekChips block={block} today={today} />
          <BlockWeek block={block} members={members} workout={log.workout} lit={lit} />
        </>
      ) : ended ? (
        <>
          <BlockRecapView recap={blockRecap(log, dated, today)} workout={log.workout} />
          <BlockWeek
            block={block}
            members={members}
            workout={log.workout}
            lit={lit}
            canAdd={false}
          />
        </>
      ) : (
        <BlockOverview
          recap={blockRecap(log, dated, today)}
          plan={log.plan}
          workout={log.workout}
          lit={lit}
        />
      )}
      {again && <PlanAgainSheet block={block} onClose={() => setAgain(false)} />}
    </ScreenFrame>
  );
}
