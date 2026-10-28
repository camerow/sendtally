import React from "react";
import { Pressable, Text, View } from "react-native";
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
import { Icon } from "../../components/Icon";
import { StravaMark } from "../../components/StravaMark";
import { pressRow } from "../../lib/press";
import { SESSION_ROW_HEIGHT, rowMeta, rowTitle } from "./SessionRow";
import { DayColumn } from "./SessionRowParts";
import { CategoryMark } from "../training/library/CategoryMark";

/** A hang session carries no tags, so it is one plain row tall before any block line. */
export const HANG_ROW_HEIGHT = SESSION_ROW_HEIGHT;

export type HangRowProps = {
  hang: HangHistoryRow;
  onPress: () => void;
  inset?: boolean;
  divider?: boolean;
  /** "Winter base · W4" when it ran one of a block's workouts. */
  blockTag?: string;
};

/** A hangboard session in the log, laid out like a session row. */
export function HangRow({
  hang,
  onPress,
  inset = false,
  divider = true,
  blockTag,
}: HangRowProps): React.ReactElement {
  const { weekday, day } = sessionDay({ start_at: hangAt(hang) });
  const title = hangTitle(hang);
  const meta = hangMetaLabel(hang);
  const effort = hangEffortLabel(hang);
  const onStrava = hang.stravaActivityId !== null;
  const spoken = [
    title,
    `${weekday} ${day}`,
    meta,
    blockTag ?? null,
    effort,
    onStrava ? t("sessions.postedToStrava") : null,
  ]
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
        borderBottomWidth: divider ? 1 : 0,
        borderBottomColor: colors.lineOnLightSoft,
      })}
    >
      <DayColumn weekday={weekday} day={day} />
      <CategoryMark kind="hangboard" size={28} />
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
        {blockTag !== undefined && (
          <Text numberOfLines={1} style={rowMeta}>
            {blockTag}
          </Text>
        )}
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
      <Icon name="chevron" size={12} strokeWidth={2} color="rgba(64,63,76,0.35)" />
    </Pressable>
  );
}
