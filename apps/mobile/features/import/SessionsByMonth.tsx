import React from "react";
import { View } from "react-native";
import type { ImportSession } from "@sendtally/core/import";
import { monthName } from "@sendtally/features/sessions";
import { SectionHeader } from "../sessions/SectionHeader";
import { PlannedSessionRow } from "./PlannedSessionRow";

/** Sessions from the file, newest first, under the Log's month headings. */
export function SessionsByMonth({
  rows,
}: {
  rows: { session: ImportSession; meta: string }[];
}): React.ReactElement {
  return (
    <View style={{ marginHorizontal: -18 }}>
      {rows.map(({ session, meta }, i) => (
        <React.Fragment key={i}>
          {session.date.slice(0, 7) !== rows[i - 1]?.session.date.slice(0, 7) && (
            <SectionHeader
              title={monthName(Number(session.date.slice(5, 7)))}
              meta={session.date.slice(0, 4)}
            />
          )}
          <PlannedSessionRow session={session} meta={meta} />
        </React.Fragment>
      ))}
    </View>
  );
}
