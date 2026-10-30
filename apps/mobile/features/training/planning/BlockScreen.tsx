import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { blockEnd, blockWeekOn, isDated } from "@sendtally/core/hang";
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
import { BlockOverview } from "./BlockOverview";
import { BlockRecapView } from "./BlockRecapView";
import { BlockWeek } from "./BlockWeek";
import { PlanAgainSheet } from "./PlanAgainSheet";
import { TemplateHeader } from "./TemplateHeader";

export type BlockScreenProps = {
  id: string;
  /** A plan just added, lit for a moment. */
  highlight?: string;
  /** Where back goes, as that screen is called; plain Back without it. */
  back?: string;
  /** Just made by New block: its name is typed first. */
  fresh?: boolean;
};

/**
 * One block: a template built in place and scheduled from here; a scheduled block's weeks
 * while it runs, Edit changing it; a recap and Plan again once it is over.
 */
export function BlockScreen({
  id,
  highlight,
  back,
  fresh = false,
}: BlockScreenProps): React.ReactElement | null {
  const lit = useLit(highlight);
  const { today } = useHangData();
  const api = useApi();
  const plan = usePlan(api);
  const { log } = useTrainingLog(api);
  const actions = usePlanActions();
  const [again, setAgain] = React.useState(false);
  const [week, setWeek] = React.useState<number | null>(null);
  const block = log.plan.blocks.find((b) => b.id === id);
  const members = block === undefined ? [] : blockMembers(log.plan, block);

  // An untitled template left with nothing in it was never really made.
  const empty = block !== undefined && !isDated(block) && block.name === "" && members.length === 0;
  const left = React.useRef({ empty, remove: actions.deleteBlock });
  React.useEffect(() => {
    left.current = { empty, remove: actions.deleteBlock };
  });
  React.useEffect(
    () => () => {
      if (left.current.empty) void left.current.remove(id);
    },
    [id]
  );

  if (plan.state.status !== "ready")
    return <LoadState state={plan.state} onRetry={() => void plan.reload()} framed />;
  if (block === undefined) return null;
  const dated = isDated(block) ? block : null;
  const ended = dated !== null && blockEnd(dated) <= today;
  const shown = week ?? (dated === null ? 1 : (blockWeekOn(dated, today) ?? 1));
  const schedulable = members.some((m) => m.weekdays.length > 0);
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
          onEdit={
            dated === null
              ? undefined
              : () => router.push({ pathname: "/plan/block/edit", params: { id } })
          }
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
                title: t("plan.deleteBlockTitle", { name: block.name || t("plan.untitled") }),
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
            disabled={dated === null && !schedulable}
            variant="primary"
            height={54}
          />
        ) : undefined
      }
    >
      {dated === null ? (
        <>
          <TemplateHeader
            block={block}
            today={today}
            autoFocus={fresh}
            week={shown}
            onPickWeek={setWeek}
            onSave={(b) => void actions.saveBlock(b)}
          />
          <BlockWeek block={block} members={members} workout={log.workout} lit={lit} week={shown} />
        </>
      ) : (
        <>
          <View style={{ gap: 4 }}>
            {ended && <Label color={colors.fern}>{t("plan.finished")}</Label>}
            <Title size={34}>{block.name}</Title>
            <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
              {`${blockDates(dated)} · ${t("calendar.weeks", { count: block.weeks })}`}
            </Text>
          </View>
          {ended ? (
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
              week={shown}
              onPickWeek={setWeek}
            />
          )}
        </>
      )}
      {again && <PlanAgainSheet block={block} onClose={() => setAgain(false)} />}
    </ScreenFrame>
  );
}
