import React from "react";
import { t } from "@sendtally/features/i18n";
import { AccountButton } from "../../components/AccountButton";
import { ScreenHeader } from "../../components/ScreenHeader";
import { StatisticsScreen } from "../../features/training/statistics/StatisticsScreen";

export default function Trends(): React.ReactElement {
  return (
    <StatisticsScreen
      header={<ScreenHeader title={t("training.statistics")} right={<AccountButton />} />}
    />
  );
}
