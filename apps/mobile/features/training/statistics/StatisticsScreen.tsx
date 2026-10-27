import React from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { useTrainingMode } from "@sendtally/features/settings";
import {
  ACTIVITY_KINDS,
  STATISTICS_RANGES,
  statisticsRangeLabel,
  useStatisticsOverview,
  type ActivityKind,
  type StatisticsRange,
} from "@sendtally/features/statistics";
import { Chip } from "../../../components/Chip";
import { useApi } from "../../../lib/api";
import { Paywall } from "../../billing/Paywall";
import { useCanSeeInsights } from "../../billing/useBilling";
import { DashedPanel } from "../components/DashedPanel";
import { type } from "../type";
import { TopGymSend } from "./TopGymSend";
import { WeeklyEffort } from "./WeeklyEffort";
import { WeeklySessions } from "./WeeklySessions";

const GAP = 14;
const FREE_RANGE: StatisticsRange = "12w";
const CLIMBING_ONLY: readonly ActivityKind[] = ["climbing"];

function Charts({
  range,
  kinds,
  member,
  onLocked,
}: {
  range: StatisticsRange;
  kinds: readonly ActivityKind[];
  member: boolean;
  onLocked: () => void;
}): React.ReactElement {
  const state = useStatisticsOverview(useApi(), range, kinds);
  if (state.status === "loading")
    return <ActivityIndicator color={colors.gunmetal} style={{ alignSelf: "flex-start" }} />;
  if (state.status === "error")
    return (
      <Text style={[type.body, { fontSize: 14, color: colors.textSecondary }]}>
        {state.message}
      </Text>
    );
  const vm = state.data;
  if (vm.sessions === 0) return <DashedPanel body={t("statistics.empty")} />;
  return (
    <>
      <WeeklySessions vm={vm} />
      <WeeklyEffort vm={vm} />
      <TopGymSend vm={vm.topSend} locked={!member} onLocked={onLocked} />
    </>
  );
}

/** How often, how hard it felt, and the gym grade you send; climbing alone with training off. */
export function StatisticsScreen({ header }: { header: React.ReactNode }): React.ReactElement {
  const member = useCanSeeInsights();
  const training = useTrainingMode(useApi());
  const [chosen, setChosen] = React.useState<StatisticsRange>(FREE_RANGE);
  const range = member === true ? chosen : FREE_RANGE;
  const scroll = React.useRef<ScrollView>(null);
  const paywallY = React.useRef(0);
  const viewportHeight = React.useRef(0);
  const contentHeight = React.useRef(0);
  const toPaywall = React.useCallback((): void => {
    const end = Math.max(0, contentHeight.current - viewportHeight.current);
    scroll.current?.scrollTo({ y: Math.min(paywallY.current - GAP, end), animated: true });
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
      {header}
      <ScrollView
        ref={scroll}
        onLayout={(e) => (viewportHeight.current = e.nativeEvent.layout.height)}
        onContentSizeChange={(_, height) => (contentHeight.current = height)}
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingTop: 4,
          paddingBottom: 24,
          gap: GAP,
        }}
      >
        {member === null ? (
          <ActivityIndicator color={colors.gunmetal} style={{ alignSelf: "flex-start" }} />
        ) : (
          <>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {STATISTICS_RANGES.map((r) => {
                const locked = !member && r !== FREE_RANGE;
                return (
                  <Chip
                    key={r}
                    label={statisticsRangeLabel(r)}
                    active={range === r}
                    locked={locked}
                    onPress={() => (locked ? toPaywall() : setChosen(r))}
                  />
                );
              })}
            </View>
            <Charts
              range={range}
              kinds={training.enabled ? ACTIVITY_KINDS : CLIMBING_ONLY}
              member={member}
              onLocked={toPaywall}
            />
            {!member && (
              <View onLayout={(e) => (paywallY.current = e.nativeEvent.layout.y)}>
                <Paywall />
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
