import React from "react";
import { ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { t } from "@sendtally/features/i18n";
import { colors } from "@sendtally/design/tokens";
import { ScreenHeader } from "../../components/ScreenHeader";
import { useCanSeeInsights } from "../../features/billing/useBilling";
import { TrendsList } from "../../features/trends/TrendsList";

const GAP = 14;

export default function Trends(): React.ReactElement {
  const canSeeInsights = useCanSeeInsights();
  const scroll = React.useRef<ScrollView>(null);
  const panelY = React.useRef(0);
  const viewportHeight = React.useRef(0);
  const contentHeight = React.useRef(0);
  const scrollToPanel = React.useCallback((): void => {
    const end = Math.max(0, contentHeight.current - viewportHeight.current);
    scroll.current?.scrollTo({ y: Math.min(panelY.current - GAP, end), animated: true });
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
      <ScreenHeader title={t("common.trends")} />
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
        {canSeeInsights === null && (
          <ActivityIndicator color={colors.gunmetal} style={{ alignSelf: "flex-start" }} />
        )}
        {canSeeInsights !== null && (
          <TrendsList
            preview={!canSeeInsights}
            onLockedRange={scrollToPanel}
            onPaywallLayout={(y) => (panelY.current = y)}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
