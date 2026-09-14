import React from "react";
import { ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { t } from "@sendtally/features/i18n";
import { colors } from "@sendtally/design/tokens";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useCanSeeInsights } from "../../features/billing/useBilling";
import { TrendsList } from "../../features/trends/TrendsList";

export default function Trends(): React.ReactElement {
  const canSeeInsights = useCanSeeInsights();
  const scroll = React.useRef<ScrollView>(null);
  const scrollToPanel = React.useCallback((): void => {
    scroll.current?.scrollToEnd({ animated: true });
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
      <ScreenHeader title={t("common.trends")} />
      <ScrollView
        ref={scroll}
        contentContainerStyle={{
          paddingHorizontal: 18,
          paddingTop: 4,
          paddingBottom: 24,
          gap: 14,
        }}
      >
        {canSeeInsights === null && (
          <ActivityIndicator color={colors.gunmetal} style={{ alignSelf: "flex-start" }} />
        )}
        {canSeeInsights !== null && (
          <TrendsList preview={!canSeeInsights} onLockedRange={scrollToPanel} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
