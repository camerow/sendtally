import React from "react";
import { protocolDose, type WeightUnit } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { KIND_LOOK } from "@sendtally/features/training";
import {
  doseSummary,
  partDoses,
  partHangs,
  partSetLine,
  partTotal,
  type PartInPlayer,
} from "@sendtally/features/workouts";
import { Icon } from "../../components/Icon";
import { PartSets } from "../log/PartSets";

export type FingersCardProps = {
  part: PartInPlayer;
  unit: WeightUnit;
  gripName: (id: string) => string;
  /** Opens the hang timer on the part's grips, or back where it was. */
  onStart: () => void;
  onRemoved: (message: string, undo: () => void) => void;
};

/**
 * A mix's fingerboard part in the workout view, where its first grip sits: its grips and Start;
 * Resume while the timer has it; once the timer ends, the sets it held to edit in place.
 */
export function FingersCard({
  part,
  unit,
  gripName,
  onStart,
  onRemoved,
}: FingersCardProps): React.ReactElement {
  const { planned, state } = part;
  const running = state !== undefined && "run" in state;
  return (
    <section className="player-card">
      <div className="player-card-head">
        <h2 className="player-card-name">{t("workouts.fingerboard")}</h2>
        {state !== undefined && (
          <span className="player-card-meta">
            {t("summary.hangsOf", { held: partHangs(state), total: partTotal(planned) })}
          </span>
        )}
      </div>
      {state !== undefined && "done" in state ? (
        <PartSets
          done={state.done}
          planned={partDoses(planned)}
          setup={state.setups[0] ?? { edgeMm: 0, loadKg: 0 }}
          kind={planned.items[0].workout.kind}
          unit={unit}
          gripName={gripName}
          onSetup={(setup) => part.change({ ...state, setups: [setup, ...state.setups.slice(1)] })}
          onChange={(done) => part.change({ ...state, done })}
          onRemoved={onRemoved}
        />
      ) : (
        <>
          {planned.items.map((i, k) => (
            <div key={k} className="player-grip">
              <span className="player-grip-name">
                <span className="done-card-mark" style={{ background: KIND_LOOK.hangboard.ink }} />
                {gripName(i.workout.grip)}
              </span>
              <span className="player-dose">
                {doseSummary("hangboard", i.dose ?? protocolDose(i.workout), unit)}
              </span>
            </div>
          ))}
          {running && (
            <span className="player-dose">{partSetLine(state.run, planned, gripName)}</span>
          )}
          <button type="button" className="detail-primary player-start" onClick={onStart}>
            <Icon name="play" size={16} strokeWidth={2.2} />
            {running ? t("hang.resume") : t("hang.start")}
          </button>
        </>
      )}
    </section>
  );
}
