import React from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { AccountButton } from "../../components/AccountButton";
import { ScreenHeader } from "../../components/ScreenHeader";
import { HangDataProvider } from "../../features/training/data/HangDataProvider";
import { TodayScreen } from "../../features/training/today/TodayScreen";

export default function Today(): React.ReactElement {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }} edges={["top"]}>
      <ScreenHeader title={t("training.today")} right={<AccountButton />} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 4, paddingBottom: 32 }}
      >
        <HangDataProvider>
          <TodayScreen />
        </HangDataProvider>
      </ScrollView>
    </SafeAreaView>
  );
}
