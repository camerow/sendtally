import React from "react";
import type { WeightUnit } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import {
  partDoses,
  partHangs,
  partSetLine,
  partTotal,
  type PartInPlayer,
} from "@sendtally/features/workouts";
import { Icon } from "../../components/Icon";
import { PartSets } from "../log/PartSets";
import { FingersGrip } from "./FingersGrip";

export type FingersCardProps = {
  part: PartInPlayer;
  unit: WeightUnit;
  gripName: (id: string) => string;
  /** Opens the hang timer on the part's grips, or back where it was. */
  onStart: () => void;
  onRemoved: (message: string, undo: () => void) => void;
};

/**
 * A mix's fingerboard part in the workout view, where its first grip sits: a block per grip and Start;
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
    <section className="fingers-part">
      <div className="fingers-head">
        <h2 className="fingers-title">{t("workouts.fingerboard")}</h2>
        {state !== undefined && (
          <span className="fingers-count">
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
            <FingersGrip
              key={k}
              workout={i.workout}
              dose={i.dose}
              setup={running ? state.setups[k] : undefined}
            />
          ))}
          {running && (
            <span className="fingers-set-line">{partSetLine(state.run, planned, gripName)}</span>
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
