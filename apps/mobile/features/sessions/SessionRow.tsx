import React from "react";
import { Pressable, Text, View } from "react-native";
import type { SessionRow as SessionRowData } from "@sendtally/api-client";
import {
  IN_PROGRESS_LABEL,
  sessionDay,
  sessionGradeLabels,
  sessionMetaLabel,
  type SessionBadge,
} from "@sendtally/features/sessions";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";

export const SESSION_ROW_HEIGHT = 59;
export const SESSION_ROW_TAGS_HEIGHT = 17;

export function sessionRowHeight(session: SessionRowData): number {
  return SESSION_ROW_HEIGHT + (session.tags.length > 0 ? SESSION_ROW_TAGS_HEIGHT : 0);
}

export type SessionRowProps = {
  session: SessionRowData;
  title: string;
  badge: SessionBadge | null;
  onPress: () => void;
};

export function SessionRow({
  session,
  title,
  badge,
  onPress,
}: SessionRowProps): React.ReactElement {
  const { weekday, day } = sessionDay(session);
  const meta = sessionMetaLabel(session);
  const onStrava = badge === "on_strava";
  const inProgress = badge === "in_progress";
  const spoken = [
    title,
    `${weekday} ${day}`,
    meta,
    inProgress ? IN_PROGRESS_LABEL : null,
    onStrava ? "posted to Strava" : null,
  ]
    .filter((part) => part !== null)
    .join(", ");

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={spoken}
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
      <View style={{ width: 34 }}>
        <Text
          style={{
            fontFamily: fonts.monoMedium,
            fontSize: 9,
            lineHeight: 11,
            letterSpacing: 0.72,
            color: colors.textMuted,
          }}
        >
          {weekday}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 3 }}>
          <Text
            style={{
              fontFamily: fonts.monoSemiBold,
              fontSize: 17,
              lineHeight: 20,
              letterSpacing: -0.2,
              color: colors.gunmetal,
            }}
          >
            {day}
          </Text>
          {onStrava && (
            <View
              style={{
                width: 6,
                height: 6,
                marginTop: 4,
                borderRadius: 3,
                backgroundColor: colors.azure,
              }}
            />
          )}
        </View>
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: fonts.sansSemiBold,
            fontSize: 15,
            lineHeight: 19,
            color: colors.gunmetal,
          }}
        >
          {title}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: fonts.mono,
            fontSize: 11,
            lineHeight: 14,
            color: colors.textSecondary,
          }}
        >
          {meta}
          {inProgress && (
            <Text style={{ fontFamily: fonts.monoMedium, color: colors.watermelonInk }}>
              {` · ${IN_PROGRESS_LABEL}`}
            </Text>
          )}
        </Text>
        {session.tags.length > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4 }}>
            {session.tags.map((tag) => (
              <Text
                key={tag.id}
                style={{
                  fontFamily: fonts.monoMedium,
                  fontSize: 8,
                  lineHeight: 10,
                  letterSpacing: 0.6,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: radius.pill,
                  overflow: "hidden",
                  backgroundColor: colors.petalTint,
                  color: colors.gunmetal,
                }}
              >
                {tag.name.toUpperCase()}
              </Text>
            ))}
          </View>
        )}
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
              color: g.kind === "sent" ? colors.watermelonInk : colors.textMuted,
            }}
          >
            {g.label}
          </Text>
        ))}
      </View>
      <Icon name="chevron" size={12} strokeWidth={2} color="rgba(64,63,76,0.35)" />
    </Pressable>
  );
}
