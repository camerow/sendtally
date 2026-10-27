import React from "react";
import { View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { BackButton } from "../components/BackButton";
import { ScreenHeader } from "../components/ScreenHeader";
import { StatisticsScreen } from "../features/training/statistics/StatisticsScreen";

export default function Statistics(): React.ReactElement {
  return (
    <StatisticsScreen
      header={
        <>
          <View style={{ paddingHorizontal: 18 }}>
            <BackButton label={t("journal.log")} />
          </View>
          <ScreenHeader title={t("training.statistics")} />
        </>
      }
    />
  );
}
