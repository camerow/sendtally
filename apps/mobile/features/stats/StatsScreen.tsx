import React from "react";
import { ScrollView } from "react-native";
import { t } from "@sendtally/features/i18n";
import { PREVIEW_TREND_RANGE, shownRange, type TrendRange } from "@sendtally/features/trends";
import { RangeChips } from "../../components/RangeChips";
import { useCanSeeInsights } from "../billing/useBilling";
import { ClimbingInsights } from "../climbs/ClimbingInsights";
import { Segmented } from "../training/components/Segmented";
import { SegmentSwipe } from "../../components/SegmentSwipe";
import { HangDataProvider } from "../training/data/HangDataProvider";
import { TrainingInsights } from "../training/insights/TrainingInsights";
import { useStatsSegment } from "./statsSegment";

/** Climbing and Training over one range: the segment stays on the device, the range on the tab. */
export function StatsScreen(): React.ReactElement {
  const member = useCanSeeInsights();
  const [segment, setSegment] = useStatsSegment();
  const [picked, setPicked] = React.useState<TrendRange>(PREVIEW_TREND_RANGE);
  const range = shownRange(member, picked);
  const segments = [
    { value: "climbing" as const, label: t("statistics.climbing") },
    { value: "training" as const, label: t("statistics.training") },
  ];
  return (
    <SegmentSwipe options={segments} value={segment} onChange={setSegment}>
      <ScrollView
        contentContainerStyle={{ gap: 14, paddingHorizontal: 18, paddingTop: 4, paddingBottom: 32 }}
      >
        <Segmented value={segment} onChange={setSegment} options={segments} />
        <RangeChips member={member} shown={range} onPick={setPicked} />
        {segment === "climbing" ? (
          <ClimbingInsights range={range} />
        ) : (
          <HangDataProvider>
            <TrainingInsights range={range} />
          </HangDataProvider>
        )}
      </ScrollView>
    </SegmentSwipe>
  );
}
