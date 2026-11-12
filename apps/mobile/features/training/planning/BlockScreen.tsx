import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import { blockEnded, blockWeekOn, isDated } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import {
  blockMembers,
  blockRecap,
  hasDays,
  scheduleOf,
  usePlan,
  useTrainingLog,
  blockDateRange,
} from "@sendtally/features/training";
import { ScreenFrame } from "../../../components/ScreenFrame";
import { Toast } from "../../../components/Toast";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { DetailActions } from "../components/DetailActions";
import { EditorHeader } from "../components/EditorHeader";
import { deleteRow } from "../components/deleteRow";
import { Label } from "../components/Label";
import { NameSheet } from "../components/NameSheet";
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
import { BlockHeader } from "./BlockHeader";
import { MoveStartSheet } from "./MoveStartSheet";
import { usePlanDraft } from "./usePlanDraft";

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
 * One block: a template scheduled from here, or a scheduled block's weeks while it runs, and
 * Edit to change its name, length, days and (until it starts) first day, saved together; a
 * recap and Plan again once it is over.
 */
export function BlockScreen({
  id,
  highlight,
  back,
  fresh = false,
}: BlockScreenProps): React.ReactElement {
  const lit = useLit(highlight);
  // Coming back from an add replaces the route's params, so keep where back went first.
  const [backLabel] = React.useState(back);
  const { today } = useHangData();
  const api = useApi();
  const plan = usePlan(api);
  const { log } = useTrainingLog(api);
  const actions = usePlanActions();
  const [again, setAgain] = React.useState(false);
  const [moving, setMoving] = React.useState(false);
  const [naming, setNaming] = React.useState(false);
  const [template, setTemplate] = React.useState<{ id: string; name: string } | null>(null);
  const [week, setWeek] = React.useState<number | null>(null);
  // A new block opens in Edit mode, its name typed first.
  const draft = usePlanDraft(log.plan, fresh);
  const saved = log.plan.blocks.find((b) => b.id === id);
  const block = draft.plan.blocks.find((b) => b.id === id);
  const members = block === undefined ? [] : blockMembers(draft.plan, block);

  // An untitled template left with nothing in it was never really made.
  const empty = saved !== undefined && !isDated(saved) && saved.name === "" && members.length === 0;
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
  // Gone, deleted elsewhere: Back still leaves.
  if (block === undefined || saved === undefined) return <ScreenFrame backLabel={backLabel} />;
  const dated = isDated(block) ? block : null;
  const ended = blockEnded(block, today);
  const current = dated === null ? null : blockWeekOn(dated, today);
  const shown = Math.min(block.weeks, week ?? current ?? 1);
  const schedulable = members.some((m) => hasDays(scheduleOf(log.plan, m)));
  const editing = draft.editing && !ended;
  const weekProps = {
    plan: draft.plan,
    editing,
    onToggle: draft.toggle,
    onSchedules: draft.setSchedules,
    onPickWeek: setWeek,
    onMove: (membershipId: string, by: -1 | 1) => draft.move(id, membershipId, by),
    ...(!ended && { onEditDays: draft.begin }),
  };
  const saveAsTemplate = async (name: string): Promise<void> => {
    const copy = randomUUID();
    if (!(await actions.copyBlock(id, copy, null))) return;
    if (name !== saved.name) await actions.saveBlock({ ...saved, id: copy, start: null, name });
    setTemplate({ id: copy, name });
  };

  return (
    <ScreenFrame
      backLabel={backLabel}
      {...(editing && {
        header: (
          <EditorHeader
            title={t("plan.editBlock")}
            onCancel={draft.cancel}
            onSave={draft.save}
            solid
          />
        ),
      })}
      action={
        <DetailActions
          {...(!ended && { onEdit: draft.begin })}
          menu={[
            ...(dated === null
              ? []
              : [
                  {
                    icon: "copy" as const,
                    title: t("plan.saveAsTemplate"),
                    onPress: () => setNaming(true),
                  },
                ]),
            deleteRow({
              title: t("plan.deleteBlock"),
              confirm: {
                title: t("plan.deleteBlockTitle", { name: block.name || t("plan.untitled") }),
                body: t("plan.deleteBlockBody"),
              },
              onDelete: () => void actions.deleteBlock(id),
            }),
          ]}
        />
      }
      overlay={
        template !== null && (
          <Toast
            message={t("plan.savedAsTemplate", { name: template.name })}
            action={{
              label: t("plan.viewTemplate"),
              onPress: () =>
                router.push({
                  pathname: "/plan/block/[id]",
                  params: { id: template.id, back: block.name || t("plan.untitled") },
                }),
            }}
            onHide={() => setTemplate(null)}
          />
        )
      }
      footer={
        !editing && (ended || dated === null) ? (
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
      {dated === null || !ended ? (
        <>
          <BlockHeader
            key={editing ? "edit" : "read"}
            block={block}
            today={today}
            editing={editing}
            savedName={saved.name}
            autoFocus={fresh}
            week={shown}
            onPickWeek={setWeek}
            onSave={draft.setBlock}
            minWeeks={current ?? 1}
            {...(dated !== null && today < dated.start && { onMoveStart: () => setMoving(true) })}
          />
          {dated === null ? (
            <BlockWeek
              block={block}
              members={members}
              workout={log.workout}
              lit={lit}
              week={shown}
              {...weekProps}
            />
          ) : (
            <BlockOverview
              recap={blockRecap(log, dated, today)}
              workout={log.workout}
              lit={lit}
              week={shown}
              {...weekProps}
            />
          )}
        </>
      ) : (
        <>
          <View style={{ gap: 4 }}>
            <Label color={colors.fern}>{t("plan.finished")}</Label>
            <Title size={34}>{block.name}</Title>
            <Text style={[type.mono, { fontSize: 12, color: colors.textSecondary }]}>
              {`${blockDateRange(dated)} · ${t("calendar.weeks", { count: block.weeks })}`}
            </Text>
          </View>
          <BlockRecapView recap={blockRecap(log, dated, today)} workout={log.workout} />
          <BlockWeek
            block={block}
            members={members}
            workout={log.workout}
            lit={lit}
            canAdd={false}
          />
        </>
      )}
      {moving && dated !== null && (
        <MoveStartSheet
          block={dated}
          onPick={(start) => draft.setBlock({ ...dated, start })}
          onClose={() => setMoving(false)}
        />
      )}
      {naming && (
        <NameSheet
          title={t("plan.saveAsTemplate")}
          name={saved.name}
          action={t("plan.saveTemplate")}
          onSave={(name) => void saveAsTemplate(name)}
          onClose={() => setNaming(false)}
        />
      )}
      {again && <PlanAgainSheet block={block} back={backLabel} onClose={() => setAgain(false)} />}
    </ScreenFrame>
  );
}
