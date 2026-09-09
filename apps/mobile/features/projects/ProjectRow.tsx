import React from "react";
import { Pressable, Text, View } from "react-native";
import type { ClimbSummary } from "@sendtally/api-client";
import { climbGradeLabel, projectMetaLabel, projectStatus } from "@sendtally/features/climbs";
import { colors, fonts, radius } from "@sendtally/design/tokens";

export type ProjectRowProps = {
  climb: ClimbSummary;
  onUnmark: () => void;
};

function lastTriedLabel(climb: ClimbSummary): string {
  if (climb.sessions === 0) return "NOT TRIED YET";
  const d = new Date(climb.last_at);
  const day = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  return `LAST ${day.toUpperCase()}`;
}

export function ProjectRow({ climb, onUnmark }: ProjectRowProps): React.ReactElement {
  const sent = projectStatus(climb) === "sent";
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderBottomWidth: 1,
        borderBottomColor: colors.lineOnLightSoft,
      }}
    >
      <Text
        style={{
          width: 56,
          fontFamily: fonts.monoSemiBold,
          fontSize: 15,
          color: colors.gunmetal,
        }}
      >
        {climbGradeLabel(climb)}
      </Text>
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Text
          numberOfLines={1}
          style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.gunmetal }}
        >
          {climb.name}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: fonts.monoMedium,
            fontSize: 10,
            letterSpacing: 0.6,
            color: colors.textMuted,
          }}
        >
          {projectMetaLabel(climb)} · {lastTriedLabel(climb)}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 6 }}>
        <Text
          style={{
            fontFamily: fonts.monoMedium,
            fontSize: 10,
            letterSpacing: 0.6,
            color: colors.gunmetal,
            paddingHorizontal: 9,
            paddingVertical: 4,
            borderRadius: radius.pill,
            backgroundColor: sent ? colors.gold : "rgba(64,63,76,0.06)",
            overflow: "hidden",
          }}
        >
          {sent ? "SENT" : "OPEN"}
        </Text>
        <Pressable
          onPress={onUnmark}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${climb.name} from projects`}
          style={{ minHeight: 28, justifyContent: "center" }}
        >
          <Text
            style={{
              fontFamily: fonts.monoMedium,
              fontSize: 10,
              letterSpacing: 0.6,
              color: colors.textFaint,
            }}
          >
            REMOVE
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
