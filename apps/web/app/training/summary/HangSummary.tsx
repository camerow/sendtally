import React from "react";
import type { HangSessionRecord } from "@sendtally/api-client";
import { clock, hangSessionSeconds } from "@sendtally/core/hang";
import {
  effortTile,
  gripLoads,
  hangGrids,
  hangTotals,
  hangItem,
  kindLabel,
  pastSessions,
} from "@sendtally/features/activities";
import { newBestOf, type HangActions, type HangModel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { hangTitle } from "@sendtally/features/sessions";
import { KIND_LOOK, type TrainingLog } from "@sendtally/features/training";
import { HistoryList } from "../../components/detail/HistoryList";
import { activityPath } from "../log/paths";
import { GripTrend } from "./GripTrend";
import { HangResultCard } from "./HangResultCard";
import { NewBestCard } from "./NewBestCard";
import { SummaryFrame } from "./SummaryFrame";

export type HangSummaryProps = {
  session: HangSessionRecord;
  model: HangModel;
  log: TrainingLog;
  actions: HangActions;
};

/** A finished hangboard session: a new best when it set one, each grip it ran with its hangs set by set and its added weight over time, its past sessions. */
export function HangSummary({
  session,
  model,
  log,
  actions,
}: HangSummaryProps): React.ReactElement {
  const unit = model.settings.units;
  const all = model.sessions;
  const totals = hangTotals(session);
  const best = newBestOf(session, all, model.gripName(session.gripId), unit);
  return (
    <SummaryFrame
      kicker={kindLabel("hangboard")}
      kickerColor={KIND_LOOK.hangboard.ink}
      title={hangTitle(session)}
      tiles={[
        { value: clock(hangSessionSeconds(session), true), label: t("summary.length") },
        effortTile(session.rpe, log.workout(session.workoutId)?.targetRpe ?? null),
        { value: `${totals.held}/${totals.total}`, label: t("summary.hangsHeld") },
      ]}
      target={{ kind: "hang", record: session }}
      onDelete={() => void actions.deleteSession(session.id)}
    >
      {best !== null && <NewBestCard best={best} />}
      {hangGrids(session).map((grid, i) => (
        <React.Fragment key={i}>
          <HangResultCard grid={grid} gripName={model.gripName(grid.gripId)} unit={unit} />
          <GripTrend
            sessions={gripLoads(grid, [...model.data.sessions, ...model.data.parts])}
            kind={grid.kind}
            currentId={session.id}
            unit={unit}
          />
        </React.Fragment>
      ))}
      <HistoryList
        items={pastSessions(session, model.data.sessions).map((s) =>
          hangItem(s, model, session.id)
        )}
        to={activityPath}
      />
    </SummaryFrame>
  );
}
