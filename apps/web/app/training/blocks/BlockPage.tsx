import React from "react";
import { useNavigate } from "react-router";

import { t } from "@sendtally/features/i18n";
import {
  blockDateRange,
  blockRecap,
  usePlan,
  useTrainingLog,
  blockName,
  useBlockPage,
} from "@sendtally/features/training";
import { MoreMenu } from "../../components/MoreMenu";
import { Sheet } from "../../components/Sheet";
import { useToast } from "../../components/Toast";
import { DetailFrame } from "../../components/detail/DetailFrame";
import { useAppApi } from "../../lib/useAppApi";
import { useDiscardGuard } from "../../lib/useDiscardGuard";
import { useGoBack } from "../../lib/useGoBack";
import { NameSheet } from "../components/NameSheet";
import { useHangData } from "../data/HangDataContext";
import { LoadState } from "../data/LoadState";
import { usePlanActions } from "../data/usePlanActions";
import { BlockHead } from "./BlockHead";
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
  const { draft, members, page, saveAsTemplate } = useBlockPage({
    id,
    fresh,
    log,
    today,
    actions,
    newId: () => crypto.randomUUID(),
  });
  const guard = useDiscardGuard(draft.dirty);

  if (plan.state.status !== "ready")
    return (
      <DetailFrame backTo={BACK_TO}>
        <LoadState state={plan.state} onRetry={() => void plan.reload()} />
      </DetailFrame>
    );
  // Gone, deleted elsewhere: Back still leaves.
  if (page === null) return <DetailFrame backTo={BACK_TO} />;
  const { block, saved, dated, ended, current, shown, schedulable, editing, weekProps } = page;
  const name = blockName(block);
  const saveTemplate = async (named: string): Promise<void> => {
    const copy = await saveAsTemplate(named);
    if (copy === null) return;
    toast.show({
      message: t("plan.savedAsTemplate", { name: named }),
      action: { label: t("plan.viewTemplate"), onPress: () => void navigate(blockPath(copy)) },
    });
  };
  const cancel = draft.dirty ? () => guard.ask(draft.cancel) : draft.cancel;
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
      {...(editing && { backLabel: t("common.cancel"), onBack: cancel })}
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
            onPickWeek={weekProps.onPickWeek}
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
          <BlockHead
            finished
            kicker={t("plan.finished")}
            title={block.name}
            when={`${blockDateRange(dated)} · ${t("calendar.weeks", { count: block.weeks })}`}
          />
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
          onSave={(named) => void saveTemplate(named)}
          onClose={() => setNaming(false)}
        />
      )}
      {again && <PlanAgainSheet block={block} onClose={() => setAgain(false)} />}
      {guard.sheet}
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
