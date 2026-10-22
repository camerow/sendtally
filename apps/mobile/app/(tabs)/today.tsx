import React from "react";
import { t } from "@sendtally/features/i18n";
import { TrainingPlaceholder } from "../../features/training/TrainingPlaceholder";

export default function Today(): React.ReactElement {
  return <TrainingPlaceholder title={t("training.today")} body={t("training.todayEmpty")} />;
}
