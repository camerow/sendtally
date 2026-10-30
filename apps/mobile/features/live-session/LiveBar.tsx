import { router, type Href } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { gymOfDraft, useGyms } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import { tallyElapsedSeconds, tallySummary, useLiveSession } from "@sendtally/features/log-session";
import { colors, fonts } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { useApi } from "../../lib/api";
import { liveSessionStorage } from "../../lib/liveSessionStorage";
import { press } from "../../lib/press";
import { LiveClock } from "../../components/LiveClock";
import { liveRunHref, liveRunSummary, useLiveRun } from "./liveRun";

type Live = {
  name: string;
  summary: string;
  elapsed: (now: Date) => number;
  open: Href;
  stop: Href;
};

/** The climbing session or workout running, folded down on top of the tab bar: tap to open it, stop to end it. */
export function LiveBar(): React.ReactElement | null {
  const session = useLiveSession(liveSessionStorage);
  const run = useLiveRun();
  const gyms = useGyms(useApi());
  const draft = session.stored?.draft;
  const live: Live | null =
    draft !== undefined
      ? {
          name: gymOfDraft(gyms.gyms, draft.gymId)?.name ?? t("gyms.noGym"),
          summary: tallySummary(draft),
          elapsed: (now) => tallyElapsedSeconds(draft, now),
          open: "/session/live",
          stop: { pathname: "/session/live", params: { finish: "1" } },
        }
      : run !== null
        ? {
            name: run.title,
            summary: liveRunSummary(run),
            elapsed: (now) => Math.max(0, Math.floor((now.getTime() - run.startedAt) / 1000)),
            open: liveRunHref(run),
            stop: liveRunHref(run, true),
          }
        : null;
  if (live === null) return null;
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
        onPress={() => router.push(live.open)}
        accessibilityRole="button"
        accessibilityLabel={`${live.name}, ${live.summary}`}
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
            {live.name}
          </Text>
          <Text
            numberOfLines={1}
            style={{ fontFamily: fonts.mono, fontSize: 12, color: "rgba(255,255,255,0.75)" }}
          >
            {live.summary}
          </Text>
        </View>
        <LiveClock
          elapsed={live.elapsed}
          style={{ fontFamily: fonts.mono, fontSize: 15, color: colors.white }}
        />
      </Pressable>
      <Pressable
        onPress={() => router.push(live.stop)}
        accessibilityRole="button"
        accessibilityLabel={draft !== undefined ? t("tally.finishSession") : t("hang.end")}
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
