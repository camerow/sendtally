import React from "react";
import type { HangSessionRecord } from "@sendtally/api-client";
import { clock, hangSessionSeconds } from "@sendtally/core/hang";
import { effortTile, hangGrids, kindLabel } from "@sendtally/features/activities";
import { newBestOf, type HangActions, type HangModel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { hangTitle } from "@sendtally/features/sessions";
import { type TrainingLog, KIND_LOOK } from "@sendtally/features/training";
import { HangResultCard } from "./HangResultCard";
import { NewBestCard } from "./NewBestCard";
import { SummaryFrame } from "./SummaryFrame";

export type HangSummaryProps = {
  session: HangSessionRecord;
  model: HangModel;
  log: TrainingLog;
  actions: HangActions;
};

/** A finished hangboard session: a new best when it set one, then each grip it ran with its hangs set by set. */
export function HangSummary({
  session,
  model,
  log,
  actions,
}: HangSummaryProps): React.ReactElement {
  const unit = model.settings.units;
  const best = newBestOf(session, model.sessions, model.gripName(session.gripId), unit);
  return (
    <SummaryFrame
      kicker={kindLabel("hangboard")}
      kickerColor={KIND_LOOK.hangboard.ink}
      title={hangTitle(session)}
      tiles={[
        { value: clock(hangSessionSeconds(session), true), label: t("summary.length") },
        effortTile(session.rpe, log.workout(session.workoutId)?.targetRpe ?? null),
      ]}
      target={{ kind: "hang", record: session }}
      onDelete={() => void actions.deleteSession(session.id)}
    >
      {best !== null && <NewBestCard best={best} />}
      {hangGrids(session).map((grid, i) => (
        <HangResultCard key={i} grid={grid} gripName={model.gripName(grid.gripId)} unit={unit} />
      ))}
    </SummaryFrame>
  );
}
