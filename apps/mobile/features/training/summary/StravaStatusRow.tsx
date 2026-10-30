import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { colors, radius } from "@sendtally/design/tokens";
import type { StravaState } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { type } from "../type";
import { postedTime } from "./summaryText";

const STRAVA_ORANGE = "#fc5200";

export type StravaStatusRowProps = { state: StravaState };

/** Where a posted, posting or failed workout stands with Strava; nothing before a post. */
export function StravaStatusRow({ state }: StravaStatusRowProps): React.ReactElement | null {
  if (state.kind === "connect" || state.kind === "post") return null;
  const failed = state.kind === "failed";
  const label =
    state.kind === "posted"
      ? t("summary.onStrava")
      : failed
        ? t("summary.postFailed")
        : t("summary.posting");
  const aside =
    state.kind === "posted"
      ? state.postedAt === null
        ? null
        : t("summary.postedAt", { time: postedTime(state.postedAt) })
      : failed
        ? state.reason
        : null;
  return (
    <View
      accessible
      style={{
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 12,
        borderRadius: radius.control,
        backgroundColor: failed ? "rgba(196,48,61,0.08)" : colors.surfaceSoft,
      }}
    >
      {state.kind === "posting" ? (
        <ActivityIndicator size="small" color={colors.gunmetal} />
      ) : (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: failed ? colors.watermelonInk : STRAVA_ORANGE,
          }}
        />
      )}
      <Text
        style={[
          type.body,
          { flexShrink: 0, fontSize: 14, color: failed ? colors.watermelonInk : colors.gunmetal },
        ]}
      >
        {label}
      </Text>
      {aside !== null && (
        <Text
          numberOfLines={1}
          style={[
            type.mono,
            { flex: 1, textAlign: "right", fontSize: 12, color: colors.textSecondary },
          ]}
        >
          {aside}
        </Text>
      )}
    </View>
  );
}
