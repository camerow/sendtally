import React from "react";
import { View } from "react-native";
import type { ImportSession } from "@sendtally/core/import";
import { sessionTitle } from "@sendtally/features/import";
import { t } from "@sendtally/features/i18n";
import { sessionDay } from "@sendtally/features/sessions";
import { colors } from "@sendtally/design/tokens";
import { DayColumn, RowTitle } from "../sessions/SessionRowParts";

/** One session from the file, in the Log's row. */
export function PlannedSessionRow({
  session,
  meta,
}: {
  session: ImportSession;
  meta: string;
}): React.ReactElement {
  const { weekday, day } = sessionDay({ start_at: `${session.date}T00:00:00Z` });
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 11,
        paddingHorizontal: 18,
        borderBottomWidth: 1,
        borderBottomColor: colors.lineOnLightSoft,
      }}
    >
      <DayColumn weekday={weekday} day={day} />
      <View style={{ flex: 1, gap: 3 }}>
        <RowTitle title={sessionTitle(session) ?? t("common.climbingSession")} meta={meta} />
      </View>
    </View>
  );
}
