import React from "react";
import { View } from "react-native";
import type { SessionRow as SessionRowData } from "@sendtally/api-client";
import type { ClimbingSessionVM } from "@sendtally/features/climbs";
import { sessionDay, sessionTitle } from "@sendtally/features/sessions";
import { ClimbLogRow } from "../climbs/ClimbLogRow";
import { SessionRow } from "./SessionRow";
import { DayColumn } from "./SessionRowParts";

/** The day column and its gap, so a nested climb lines up under the session's title. */
const NEST = 46;

export type ClimbingSessionRowsProps = {
  session: SessionRowData;
  vm?: ClimbingSessionVM;
  onPress: () => void;
  blockTag?: string;
  inset?: boolean;
  divider?: boolean;
};

/** A named session with its climbs set in under it; a bare one is just its climbs, each by its day. */
export function ClimbingSessionRows({
  session,
  vm,
  onPress,
  blockTag,
  inset = false,
  divider = true,
}: ClimbingSessionRowsProps): React.ReactElement {
  const pad = inset ? 0 : 18;
  if (vm?.named === false) {
    const { weekday, day } = sessionDay(session);
    return (
      <>
        {vm.climbs.map((row) => (
          <View key={row.id} style={{ paddingHorizontal: pad }}>
            <ClimbLogRow
              row={row}
              leading={
                <View style={{ alignSelf: "center" }}>
                  <DayColumn weekday={weekday} day={day} />
                </View>
              }
            />
          </View>
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
        onPress={onPress}
      />
      {vm?.climbs.map((row) => (
        <View key={row.id} style={{ paddingLeft: pad + NEST, paddingRight: pad }}>
          <ClimbLogRow row={row} />
        </View>
      ))}
    </>
  );
}
