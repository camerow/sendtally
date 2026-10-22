import React from "react";
import { t } from "@sendtally/features/i18n";
import { TrainingPlaceholder } from "../../features/training/TrainingPlaceholder";

export default function Train(): React.ReactElement {
  return <TrainingPlaceholder title={t("training.train")} body={t("training.trainEmpty")} />;
}
