import React from "react";
import { Text, View } from "react-native";
import type { HangHistoryRow } from "@sendtally/api-client";
import {
  hangAt,
  hangEffortLabel,
  hangMetaLabel,
  hangTitle,
  sessionDay,
} from "@sendtally/features/sessions";
import { t } from "@sendtally/features/i18n";
import { colors, fonts } from "@sendtally/design/tokens";
import { StravaMark } from "../../components/StravaMark";
import { SESSION_ROW_HEIGHT, rowMeta, rowTitle } from "./SessionRow";
import { DayColumn } from "./SessionRowParts";

/** Where a session row's chevron sits, so the effort lines up with the grades above it. */
const CHEVRON_WIDTH = 12;

/** A hang session carries no tags, so it is always one plain row tall. */
export const HANG_ROW_HEIGHT = SESSION_ROW_HEIGHT;

/**
 * A hangtally session in the log, laid out like a session row. It has no
 * press: hangtally is where it is edited, and sendtally has no page for it.
 */
export function HangRow({
  hang,
  inset = false,
  divider = true,
}: {
  hang: HangHistoryRow;
  inset?: boolean;
  divider?: boolean;
}): React.ReactElement {
  const { weekday, day } = sessionDay({ start_at: hangAt(hang) });
  const title = hangTitle(hang);
  const meta = hangMetaLabel(hang);
  const effort = hangEffortLabel(hang);
  const onStrava = hang.stravaActivityId !== null;
  const spoken = [
    title,
    `${weekday} ${day}`,
    meta,
    effort,
    onStrava ? t("sessions.postedToStrava") : null,
  ]
    .filter((part) => part !== null)
    .join(", ");

  return (
    <View
      accessible
      accessibilityLabel={spoken}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 11,
        paddingHorizontal: inset ? 0 : 18,
        borderBottomWidth: divider ? 1 : 0,
        borderBottomColor: colors.lineOnLightSoft,
      }}
    >
      <DayColumn weekday={weekday} day={day} />
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text numberOfLines={1} style={{ flexShrink: 1, ...rowTitle }}>
            {title}
          </Text>
          {onStrava && <StravaMark />}
        </View>
        <Text numberOfLines={1} style={rowMeta}>
          {meta}
        </Text>
      </View>
      {effort !== null && (
        <Text
          style={{
            fontFamily: fonts.monoMedium,
            fontSize: 11,
            lineHeight: 13,
            letterSpacing: 0.44,
            color: colors.textMuted,
          }}
        >
          {effort}
        </Text>
      )}
      <View style={{ width: CHEVRON_WIDTH }} />
    </View>
  );
}
