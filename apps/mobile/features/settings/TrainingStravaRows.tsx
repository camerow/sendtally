import React from "react";
import { Alert } from "react-native";
import { useHang, useHangActions } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import type { StravaPostingFeature } from "@sendtally/features/settings";
import { useApi } from "../../lib/api";
import { SwitchRow } from "./SwitchRow";

export type TrainingStravaRowsProps = {
  posting: StravaPostingFeature;
};

const reportFailure = (): void => Alert.alert(t("hang.saveFailed"));

/** Training mode's own Strava switches: hangboard sessions, and every other kind of training. */
export function TrainingStravaRows({ posting }: TrainingStravaRowsProps): React.ReactElement {
  const api = useApi();
  const hang = useHang(api).state;
  const actions = useHangActions(api, reportFailure);
  return (
    <>
      <SwitchRow
        title={t("settings.postHangboard")}
        body={t("settings.postHangboardBody")}
        checked={hang.status === "ready" && hang.data.settings.postToStrava}
        disabled={hang.status !== "ready"}
        onChange={(postToStrava) => void actions.saveSettings({ postToStrava })}
      />
      <SwitchRow
        title={t("settings.postTraining")}
        body={t("settings.postTrainingBody")}
        checked={posting.training}
        disabled={posting.busy}
        onChange={posting.setTraining}
      />
    </>
  );
}
