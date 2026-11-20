import React from "react";
import type { SetDone } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { ClimbReadRow } from "./ClimbReadRow";

export type ClimbSetsReadProps = { sets: readonly SetDone[] };

/** A climbing exercise's sets as done: each set's climbs as read rows, grade then how it went. */
export function ClimbSetsRead({ sets }: ClimbSetsReadProps): React.ReactElement {
  return (
    <>
      {sets.map((set, s) => (
        <div key={s}>
          <span className="train-label climb-set-label">{t("tally.setLabel", { set: s + 1 })}</span>
          {(set.climbs ?? []).map((climb, c) => (
            <ClimbReadRow key={c} position={c + 1} climb={climb} />
          ))}
        </div>
      ))}
    </>
  );
}
