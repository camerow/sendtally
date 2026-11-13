import React from "react";
import type { SessionRow as SessionRowData } from "@sendtally/api-client";
import type { ClimbingSessionVM } from "@sendtally/features/climbs";
import { sessionDay, sessionTitle } from "@sendtally/features/sessions";
import { ClimbLogRow } from "../../climbs/components/ClimbLogRow";
import { DayColumn } from "./DayColumn";
import { SessionRow } from "./SessionRow";

export type ClimbingSessionRowsProps = {
  session: SessionRowData;
  vm?: ClimbingSessionVM | undefined;
  blockTag?: string;
  inset?: boolean;
  divider?: boolean;
};

/** A named session with its climbs set in under it; a bare one is just its climbs, each by its day. */
export function ClimbingSessionRows({
  session,
  vm,
  blockTag,
  inset = false,
  divider = true,
}: ClimbingSessionRowsProps): React.ReactElement {
  if (vm?.named === false) {
    const { weekday, day } = sessionDay(session);
    return (
      <>
        {vm.climbs.map((row) => (
          <div key={row.id} className={inset ? "log-climb" : "log-climb log-climb--padded"}>
            <ClimbLogRow row={row} leading={<DayColumn weekday={weekday} day={day} />} />
          </div>
        ))}
      </>
    );
  }
  return (
    <>
      <SessionRow
        session={session}
        title={sessionTitle(session)}
        blockTag={blockTag}
        inset={inset}
        divider={divider}
      />
      {vm?.climbs.map((row) => (
        <div
          key={row.id}
          className={
            inset ? "log-climb log-climb--nested" : "log-climb log-climb--padded log-climb--nested"
          }
        >
          <ClimbLogRow row={row} />
        </div>
      ))}
    </>
  );
}
