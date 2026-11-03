import React from "react";
import { ScrollView, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { t } from "@sendtally/features/i18n";
import { queries, useQuery } from "@sendtally/features/query";
import { defaultRange, shownRange, yearsOf, type TrendRange } from "@sendtally/features/trends";
import { useApi } from "../../lib/api";
import { RangeChips } from "../../components/RangeChips";
import { useCanSeeInsights } from "../billing/useBilling";
import { ClimbingInsights } from "../climbs/ClimbingInsights";
import { Segmented } from "../training/components/Segmented";
import { SegmentPager } from "../../components/SegmentPager";
import { HangDataProvider } from "../training/data/HangDataProvider";
import { TrainingInsights } from "../training/insights/TrainingInsights";
import { useStatsSegment } from "./statsSegment";

/** Climbing and Training over one range: the segment stays on the device, the range on the tab. */
export function StatsScreen(): React.ReactElement {
  const member = useCanSeeInsights();
  const [segment, setSegment] = useStatsSegment();
  const [picked, setPicked] = React.useState<TrendRange | null>(null);
  const range = shownRange(member, picked ?? defaultRange(member));
  const { state } = useQuery(queries.sessionsWithClimbs(useApi()));
  const years = React.useMemo(
    () =>
      state.status !== "ready"
        ? []
        : yearsOf([
            ...state.data.sessions.map((s) => s.start_at),
            ...state.data.hangSessions.map((h) => h.date),
            ...state.data.activities.map((a) => a.date),
          ]),
    [state]
  );
  const segments = [
    { value: "climbing" as const, label: t("statistics.climbing") },
    { value: "training" as const, label: t("statistics.training") },
  ];
  const progress = useSharedValue(segment === "climbing" ? 0 : 1);
  return (
    <View style={{ flex: 1 }}>
      <View style={{ gap: 14, paddingHorizontal: 18, paddingTop: 4, paddingBottom: 14 }}>
        <Segmented value={segment} onChange={setSegment} options={segments} progress={progress} />
        <RangeChips member={member} shown={range} onPick={setPicked} years={years} />
      </View>
      <SegmentPager
        options={segments}
        value={segment}
        onChange={setSegment}
        progress={progress}
        renderPage={(page) => (
          <ScrollView contentContainerStyle={{ gap: 14, paddingHorizontal: 18, paddingBottom: 32 }}>
            {page === "climbing" ? (
              <ClimbingInsights range={range} />
            ) : (
              <HangDataProvider>
                <TrainingInsights range={range} />
              </HangDataProvider>
            )}
          </ScrollView>
        )}
      />
    </View>
  );
}
