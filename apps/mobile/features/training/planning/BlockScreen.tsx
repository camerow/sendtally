import { router } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { blockEnd } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { blockRecap, usePlan, useTrainingLog } from "@sendtally/features/training";
import { ScreenFrame } from "../../../components/ScreenFrame";
import { useApi } from "../../../lib/api";
import { blockDates } from "../blocks/blockText";
import { DetailActions } from "../components/DetailActions";
import { deleteRow } from "../components/deleteRow";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { usePlanActions } from "../plan/usePlanActions";
import { useLit } from "../plan/useLit";
import { type } from "../type";
import { BlockOverview } from "./BlockOverview";
import { BlockRecapView } from "./BlockRecapView";

export type BlockScreenProps = {
  id: string;
  /** A plan just added, lit for a moment. */
  highlight?: string;
};

/** One block, read only: how it is going while it runs, a recap once it is over. Edit changes it. */
export function BlockScreen({ id, highlight }: BlockScreenProps): React.ReactElement | null {
  const lit = useLit(highlight);
  const { today } = useHangData();
  const api = useApi();
  const plan = usePlan(api);
  const { log } = useTrainingLog(api);
  const actions = usePlanActions();
  if (plan.state.status !== "ready")
    return <LoadState state={plan.state} onRetry={() => void plan.reload()} framed />;
  const block = log.plan.blocks.find((b) => b.id === id);
  if (block === undefined) return null;
  const recap = blockRecap(log, block, today);
  const ended = blockEnd(block) <= today;

  return (
    <ScreenFrame
      action={
        <DetailActions
          onEdit={() => router.push({ pathname: "/plan/block/edit", params: { id } })}
          menu={[
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
    >
      <View style={{ gap: 4 }}>
        {ended && <Label color={colors.fern}>{t("plan.finished")}</Label>}
        <Title size={34}>{block.name}</Title>
        <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
          {`${blockDates(block)} · ${t("calendar.weeks", { count: block.weeks })}`}
        </Text>
      </View>
      {ended ? (
        <BlockRecapView recap={recap} workout={log.workout} />
      ) : (
        <BlockOverview recap={recap} plan={log.plan} workout={log.workout} lit={lit} />
      )}
    </ScreenFrame>
  );
}
