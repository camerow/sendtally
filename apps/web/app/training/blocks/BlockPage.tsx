import React from "react";
import { useNavigate } from "react-router";
import { blockEnded, blockWeekOn, isDated } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import {
  blockDateRange,
  blockMembers,
  blockRecap,
  hasDays,
  scheduleOf,
  usePlan,
  usePlanDraft,
  useTrainingLog,
} from "@sendtally/features/training";
import { MoreMenu } from "../../components/MoreMenu";
import { Sheet } from "../../components/Sheet";
import { useToast } from "../../components/Toast";
import { DetailFrame } from "../../components/detail/DetailFrame";
import { useAppApi } from "../../lib/useAppApi";
import { useGoBack } from "../../lib/useGoBack";
import { NameSheet } from "../components/NameSheet";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { usePlanActions } from "../data/usePlanActions";
import { BlockHeader } from "./BlockHeader";
import { BlockOverview } from "./BlockOverview";
import { BlockRecapView } from "./BlockRecapView";
import { BlockWeek } from "./BlockWeek";
import { MoveStartSheet } from "./MoveStartSheet";
import { PlanAgainSheet } from "./PlanAgainSheet";
import { blockPath } from "./paths";

const BACK_TO = "/app/train";

export type BlockPageProps = {
  id: string;
  /** Just made by New block: its name is typed first. */
  fresh?: boolean;
};

/**
 * One block: a template scheduled from here, or a scheduled block's weeks while it runs, and
 * Edit to change its name, length, days and (until it starts) first day, saved together; a
 * recap and Plan again once it is over.
 */
export function BlockPage({ id, fresh = false }: BlockPageProps): React.ReactElement {
  const { today } = useHangData();
  const api = useAppApi();
  const plan = usePlan(api);
  const { log } = useTrainingLog(api);
  const actions = usePlanActions();
  const navigate = useNavigate();
  const toast = useToast();
  const leave = useGoBack(BACK_TO);
  const [again, setAgain] = React.useState(false);
  const [moving, setMoving] = React.useState(false);
  const [naming, setNaming] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [week, setWeek] = React.useState<number | null>(null);
  // A new block opens in Edit mode, its name typed first.
  const draft = usePlanDraft(log.plan, actions, fresh);
  const saved = log.plan.blocks.find((b) => b.id === id);
  const block = draft.plan.blocks.find((b) => b.id === id);
  const members = block === undefined ? [] : blockMembers(draft.plan, block);

  // An untitled template left with nothing in it was never really made.
  const empty = saved !== undefined && !isDated(saved) && saved.name === "" && members.length === 0;
  const left = React.useRef({ empty, remove: actions.deleteBlock });
  React.useEffect(() => {
    left.current = { empty, remove: actions.deleteBlock };
  });
  // Checked after unmounting settles, so StrictMode's remount does not count as leaving.
  const mounted = React.useRef(false);
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      setTimeout(() => {
        if (!mounted.current && left.current.empty) void left.current.remove(id);
      });
    };
  }, [id]);

  if (plan.state.status !== "ready")
    return (
      <DetailFrame backTo={BACK_TO}>
        <LoadState state={plan.state} onRetry={() => void plan.reload()} />
      </DetailFrame>
    );
  // Gone, deleted elsewhere: Back still leaves.
  if (block === undefined || saved === undefined) return <DetailFrame backTo={BACK_TO} />;
  const dated = isDated(block) ? block : null;
  const ended = blockEnded(block, today);
  const current = dated === null ? null : blockWeekOn(dated, today);
  const shown = Math.min(block.weeks, week ?? current ?? 1);
  const schedulable = members.some((m) => hasDays(scheduleOf(log.plan, m)));
  const editing = draft.editing && !ended;
  const name = block.name || t("plan.untitled");
  const weekProps = {
    plan: draft.plan,
    editing,
    onToggle: draft.toggle,
    onSchedules: draft.setSchedules,
    onPickWeek: setWeek,
    onMove: (membershipId: string, by: -1 | 1) => draft.move(id, membershipId, by),
    ...(!ended && { onEditDays: draft.begin }),
  };
  const saveAsTemplate = async (named: string): Promise<void> => {
    const copy = crypto.randomUUID();
    if (!(await actions.copyBlock(id, copy, null))) return;
    if (named !== saved.name)
      await actions.saveBlock({ ...saved, id: copy, start: null, name: named });
    toast.show({
      message: t("plan.savedAsTemplate", { name: named }),
      action: { label: t("plan.viewTemplate"), onPress: () => void navigate(blockPath(copy)) },
    });
  };
  const remove = (): void => {
    setDeleting(false);
    leave();
    void actions.deleteBlock(id);
  };

  const footer = editing ? (
    <button type="button" className="detail-primary" onClick={draft.save}>
      {t("common.save")}
    </button>
  ) : ended || dated === null ? (
    <button
      type="button"
      className="detail-primary"
      disabled={dated === null && !schedulable}
      onClick={() => setAgain(true)}
    >
      {dated === null ? t("plan.schedule") : t("plan.planAgain")}
    </button>
  ) : undefined;

  return (
    <DetailFrame
      wide
      backTo={BACK_TO}
      {...(editing && { backLabel: t("common.cancel"), onBack: draft.cancel })}
      {...(footer !== undefined && { footer })}
      action={
        !editing && (
          <span className="detail-actions">
            {!ended && (
              <button type="button" className="edit-button" onClick={draft.begin}>
                {t("common.edit")}
              </button>
            )}
            <MoreMenu
              label={t("summary.more")}
              items={[
                ...(dated === null
                  ? []
                  : [{ label: t("plan.saveAsTemplate"), onSelect: () => setNaming(true) }]),
                {
                  label: t("plan.deleteBlock"),
                  destructive: true,
                  onSelect: () => setDeleting(true),
                },
              ]}
            />
          </span>
        )
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
              week={shown}
              {...weekProps}
            />
          ) : (
            <BlockOverview
              recap={blockRecap(log, dated, today)}
              workout={log.workout}
              week={shown}
              {...weekProps}
            />
          )}
        </>
      ) : (
        <>
          <div className="block-head">
            <span className="train-label block-finished">{t("plan.finished")}</span>
            <h1 className="block-title">{block.name}</h1>
            <span className="block-when">
              {`${blockDateRange(dated)} · ${t("calendar.weeks", { count: block.weeks })}`}
            </span>
          </div>
          <BlockRecapView recap={blockRecap(log, dated, today)} workout={log.workout} />
          <BlockWeek block={block} members={members} workout={log.workout} canAdd={false} />
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
          onSave={(named) => void saveAsTemplate(named)}
          onClose={() => setNaming(false)}
        />
      )}
      {again && <PlanAgainSheet block={block} onClose={() => setAgain(false)} />}
      <Sheet
        open={deleting}
        title={t("plan.deleteBlockTitle", { name })}
        onClose={() => setDeleting(false)}
        action={{ label: t("common.delete"), danger: true, onPress: remove }}
      >
        <p className="sheet-body">{t("plan.deleteBlockBody")}</p>
      </Sheet>
    </DetailFrame>
  );
}
