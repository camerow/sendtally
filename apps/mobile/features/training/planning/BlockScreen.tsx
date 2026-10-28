import { router } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { blockEnd } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { blockRecap, useTrainingLog } from "@sendtally/features/training";
import { useApi } from "../../../lib/api";
import { blockDates } from "../blocks/blockText";
import { Button } from "../components/Button";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { useLit } from "../plan/useLit";
import { type } from "../type";
import { BlockOverview } from "./BlockOverview";
import { BlockRecapView } from "./BlockRecapView";
import { ScreenFrame } from "./ScreenFrame";

export type BlockScreenProps = {
  id: string;
  /** A plan just added, lit for a moment. */
  highlight?: string;
};

/** One block, read only: how it is going while it runs, a recap once it is over. Edit changes it. */
export function BlockScreen({ id, highlight }: BlockScreenProps): React.ReactElement | null {
  const lit = useLit(highlight);
  const { today } = useHangData();
  const { log } = useTrainingLog(useApi());
  const block = log.plan.blocks.find((b) => b.id === id);
  if (block === undefined) return null;
  const recap = blockRecap(log, block, today);
  const ended = blockEnd(block) <= today;

  return (
    <ScreenFrame
      action={
        <Button
          label={t("hang.edit")}
          onPress={() => router.push({ pathname: "/plan/block/edit", params: { id } })}
          variant="outline"
          height={44}
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
