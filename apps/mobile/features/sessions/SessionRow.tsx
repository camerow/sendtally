import React from "react";
import { Pressable, Text, View } from "react-native";
import type { SessionRow as SessionRowData } from "@sendtally/api-client";
import { sessionDay, sessionGradeLabels, sessionMetaLabel } from "@sendtally/features/sessions";
import { t } from "@sendtally/features/i18n";
import { colors, fonts } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { StravaMark } from "../../components/StravaMark";
import { pressRow } from "../../lib/press";
import { RowTags, ROW_TAGS_HEIGHT } from "./RowTags";
import { DayColumn } from "./SessionRowParts";

export const SESSION_ROW_HEIGHT = 59;

export function sessionRowHeight(session: SessionRowData): number {
  return SESSION_ROW_HEIGHT + (session.tags.length > 0 ? ROW_TAGS_HEIGHT : 0);
}

export type SessionRowProps = {
  session: SessionRowData;
  title: string;
  onPress: () => void;
  /** The last cell is the caller's: a chevron in the log, a remove control in the composer. */
  trailing?: React.ReactNode;
  /** Inside a group that already sets the row in from the screen edge. */
  inset?: boolean;
};

export function SessionRow({
  session,
  title,
  onPress,
  trailing,
  inset = false,
}: SessionRowProps): React.ReactElement {
  const { weekday, day } = sessionDay(session);
  const meta = sessionMetaLabel(session);
  const onStrava = session.strava_activity_id !== null;
  const spoken = [title, `${weekday} ${day}`, meta, onStrava ? t("sessions.postedToStrava") : null]
    .filter((part) => part !== null)
    .join(", ");

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={spoken}
      style={pressRow({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 11,
        paddingHorizontal: inset ? 0 : 18,
        borderBottomWidth: 1,
        borderBottomColor: colors.lineOnLightSoft,
      })}
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
        <RowTags tags={session.tags} />
      </View>
      <View style={{ alignItems: "flex-end", gap: 2 }}>
        {sessionGradeLabels(session).map((g) => (
          <Text
            key={g.kind}
            style={{
              fontFamily: g.kind === "sent" ? fonts.monoSemiBold : fonts.monoMedium,
              fontSize: 11,
              lineHeight: 13,
              letterSpacing: 0.44,
              color: g.kind === "sent" ? colors.labelAccent : colors.textMuted,
            }}
          >
            {g.label}
          </Text>
        ))}
      </View>
      {trailing ?? <Icon name="chevron" size={12} strokeWidth={2} color="rgba(64,63,76,0.35)" />}
    </Pressable>
  );
}

export const rowTitle = {
  fontFamily: fonts.sansSemiBold,
  fontSize: 15,
  lineHeight: 19,
  color: colors.gunmetal,
} as const;

export const rowMeta = {
  fontFamily: fonts.mono,
  fontSize: 11,
  lineHeight: 14,
  color: colors.textSecondary,
} as const;
