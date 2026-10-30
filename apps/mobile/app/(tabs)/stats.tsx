import { useLocalSearchParams } from "expo-router";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { AccountButton } from "../../components/AccountButton";
import { ScreenHeader } from "../../components/ScreenHeader";
import { StatsScreen } from "../../features/stats/StatsScreen";
import { statsSegmentStorage } from "../../lib/statsSegmentStorage";
import { useSegmentParam } from "../../lib/storedSegment";

export default function Stats(): React.ReactElement {
  const { segment } = useLocalSearchParams<{ segment?: string }>();
  useSegmentParam(statsSegmentStorage, segment);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
      <ScreenHeader title={t("statistics.tab")} right={<AccountButton />} />
      <StatsScreen />
    </SafeAreaView>
  );
}
