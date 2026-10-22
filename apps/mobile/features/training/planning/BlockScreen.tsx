import { router } from "expo-router";
import React from "react";
import { Alert, Text, View } from "react-native";
import { blockWeekOn } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { blockMembers, blockWeeks, movedTo, useTrainingLog } from "@sendtally/features/training";
import { useApi } from "../../../lib/api";
import { BlockEffort } from "../blocks/BlockEffort";
import { blockDates, blockKicker } from "../blocks/blockText";
import { Button } from "../components/Button";
import { DashedPanel } from "../components/DashedPanel";
import { Label } from "../components/Label";
import { PlanRow } from "../components/PlanRow";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { PlanRows } from "../plan/PlanRows";
import { usePlanActions } from "../plan/usePlanActions";
import { membershipWhen } from "../plans/planText";
import { DayMark } from "../today/DayMark";
import { type } from "../type";
import { ScreenFrame } from "./ScreenFrame";

export type BlockScreenProps = { id: string };

/** One block: its workouts, adding and moving plans in, and the effort logged by week. */
export function BlockScreen({ id }: BlockScreenProps): React.ReactElement | null {
  const { today } = useHangData();
  const { log } = useTrainingLog(useApi());
  const actions = usePlanActions();
  const { plan, workout } = log;
  const block = plan.blocks.find((b) => b.id === id);
  if (block === undefined) return null;
  const members = blockMembers(plan, block);
  // Weekly plans outside any block, and one-offs that fall inside this one.
  const movable = plan.memberships.filter(
    (m) =>
      m.blockId === null &&
      (m.weekdays.length > 0 || blockWeekOn(block, m.start) !== null) &&
      workout(m.workoutId) !== undefined
  );

  const remove = (): void =>
    Alert.alert(t("plan.deleteBlockTitle", { name: block.name }), t("plan.deleteBlockBody"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => {
          router.back();
          void actions.deleteBlock(block.id);
        },
      },
    ]);

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
        <Label color={colors.labelAccent}>{blockKicker(block, today)}</Label>
        <Title size={34}>{block.name}</Title>
        <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
          {blockDates(block)}
        </Text>
      </View>
      {members.length === 0 ? (
        <DashedPanel body={t("plan.blockEmpty")} />
      ) : (
        <PlanRows plan={plan} members={members} workout={workout} />
      )}
      <Button
        label={t("plan.addWorkout")}
        onPress={() => router.push({ pathname: "/plan/add", params: { blockId: id } })}
        variant="dashed"
        icon="plus"
        height={50}
      />
      {members.length > 0 && <BlockEffort weeks={blockWeeks(block, log, today)} />}
      {movable.length > 0 && (
        <View style={{ gap: 8 }}>
          <Label color={colors.textSecondary}>{t("plan.moveIn")}</Label>
          {movable.map((m) => {
            const w = workout(m.workoutId);
            if (w === undefined) return null;
            return (
              <PlanRow
                key={m.id}
                mark={<DayMark kind={w.kind} filled />}
                tag={t("plan.outsideBlocks")}
                tagColor={colors.textSecondary}
                name={w.name}
                meta={membershipWhen(m)}
                actionIcon="plus"
                onRemove={() => void actions.saveMembership(movedTo(m, block, null, today))}
                removeLabel={t("plan.moveInAria", { title: w.name })}
              />
            );
          })}
        </View>
      )}
      <Button label={t("plan.deleteBlock")} onPress={remove} variant="danger" height={50} />
    </ScreenFrame>
  );
}
