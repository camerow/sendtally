import React from "react";
import type { SetDone } from "@sendtally/core/hang";
import { wallTimeText } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { ClimbReadRow } from "./ClimbReadRow";

export type ClimbSetsReadProps = { sets: readonly SetDone[] };

/** A climbing exercise's sets as done: each set's climbs as read rows, grade then how it went, and a time set's time on its line. */
export function ClimbSetsRead({ sets }: ClimbSetsReadProps): React.ReactElement {
  return (
    <>
      {sets.map((set, s) => (
        <div key={s}>
          <span className="climb-set-label">
            <span className="train-label">{t("tally.setLabel", { set: s + 1 })}</span>
            {set.onS !== undefined && (
              <span className="climb-set-time">{wallTimeText(set.onS)}</span>
            )}
          </span>
          {(set.climbs ?? []).map((climb, c) => (
            <ClimbReadRow key={c} position={c + 1} climb={climb} />
          ))}
        </div>
      ))}
    </>
  );
}
