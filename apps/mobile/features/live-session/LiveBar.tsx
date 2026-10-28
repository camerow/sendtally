import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { gymOfDraft, useGyms } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import { tallySummary, useLiveSession } from "@sendtally/features/log-session";
import { colors, fonts } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { useApi } from "../../lib/api";
import { liveSessionStorage } from "../../lib/liveSessionStorage";
import { press } from "../../lib/press";
import { LiveClock } from "./LiveClock";

/** The running session folded down on top of the tab bar: tap to open it, stop to finish it. */
export function LiveBar(): React.ReactElement | null {
  const live = useLiveSession(liveSessionStorage);
  const gyms = useGyms(useApi());
  const draft = live.stored?.draft;
  if (draft === undefined) return null;
  const gym = gymOfDraft(gyms.gyms, draft.gymId)?.name ?? t("gyms.noGym");
  const summary = tallySummary(draft);
  return (
    <View
      style={{
        height: 56,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.gunmetal,
      }}
    >
      <Pressable
        onPress={() => router.push("/session/live")}
        accessibilityRole="button"
        accessibilityLabel={`${gym}, ${summary}`}
        style={press({
          flex: 1,
          height: 56,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingLeft: 18,
        })}
      >
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gold }} />
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.white }}
          >
            {gym}
          </Text>
          <Text
            numberOfLines={1}
            style={{ fontFamily: fonts.mono, fontSize: 12, color: "rgba(255,255,255,0.75)" }}
          >
            {summary}
          </Text>
        </View>
        <LiveClock
          draft={draft}
          style={{ fontFamily: fonts.mono, fontSize: 15, color: colors.white }}
        />
      </Pressable>
      <Pressable
        onPress={() => router.push({ pathname: "/session/live", params: { finish: "1" } })}
        accessibilityRole="button"
        accessibilityLabel={t("tally.finishSession")}
        style={press({
          width: 44,
          height: 44,
          marginHorizontal: 6,
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        <Icon name="stop" color={colors.gold} size={22} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}
