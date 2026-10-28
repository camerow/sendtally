import React from "react";
import type { HangSessionRecord } from "@sendtally/api-client";
import { clock, totalSeconds } from "@sendtally/core/hang";
import { gripSessions, hangGrid, pastSessions, previousHang } from "@sendtally/features/activities";
import {
  loadLabel,
  newBestOf,
  shortDate,
  type HangActions,
  type HangModel,
} from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { hangTitle } from "@sendtally/features/sessions";
import type { TrainingLog } from "@sendtally/features/training";
import { KIND_LOOK } from "../today/kindLook";
import { GripTrend } from "./GripTrend";
import { HangResultCard } from "./HangResultCard";
import { NewBestCard } from "./NewBestCard";
import { PastSessions } from "./PastSessions";
import { SummaryFrame } from "./SummaryFrame";
import { effortTile, kickerText } from "./summaryText";

export type HangSummaryProps = {
  session: HangSessionRecord;
  model: HangModel;
  log: TrainingLog;
  actions: HangActions;
};

/** A finished hangboard session: a new best when it set one, its hangs set by set, the weight on the grip, its past sessions. */
export function HangSummary({
  session,
  model,
  log,
  actions,
}: HangSummaryProps): React.ReactElement {
  const unit = model.settings.units;
  const all = model.sessions;
  const grid = hangGrid(session);
  const kind = session.protocol.kind;
  const best = newBestOf(session, all, model.gripName(session.gripId), unit);
  return (
    <SummaryFrame
      kicker={kickerText("hangboard", session.date, session, log.plan)}
      kickerColor={KIND_LOOK.hangboard.ink}
      title={hangTitle(session)}
      focus={session.focus}
      tiles={[
        { value: clock(totalSeconds(session.protocol), true), label: t("summary.length") },
        effortTile(session.rpe, log.workout(session.workoutId)?.targetRpe ?? null),
        { value: `${grid.held}/${grid.total}`, label: t("summary.hangsHeld") },
      ]}
      target={{ kind: "hang", record: session }}
      rpe={session.rpe}
      onDelete={() => void actions.deleteSession(session.id)}
    >
      {best !== null && <NewBestCard best={best} />}
      <HangResultCard
        session={session}
        previous={previousHang(session, all)}
        gripName={model.gripName(session.gripId)}
        unit={unit}
      />
      <GripTrend sessions={gripSessions(session, all)} currentId={session.id} unit={unit} />
      <PastSessions
        rows={pastSessions(session, all).map((s) => {
          const g = hangGrid(s);
          return {
            id: s.id,
            date: shortDate(s.date),
            meta: [
              loadLabel(kind, s.loadKg, unit),
              t("summary.hangsOf", { held: g.held, total: g.total }),
            ].join(" · "),
            effort: s.rpe === null ? null : `RPE ${s.rpe}`,
            current: s.id === session.id,
          };
        })}
      />
    </SummaryFrame>
  );
}
