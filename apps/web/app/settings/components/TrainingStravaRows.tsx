import React from "react";
import { t } from "@sendtally/features/i18n";
import type { StravaPostingFeature } from "@sendtally/features/settings";
import { HangDataProvider } from "../../training/data/HangDataProvider";
import { useHangData } from "../../training/data/HangDataContext";
import { SwitchRow } from "./SwitchRow";

export type TrainingStravaRowsProps = {
  posting: StravaPostingFeature;
};

/** Disabled until the training loads, as on mobile. */
function PendingHangboardRow(): React.ReactElement {
  return (
    <SwitchRow
      title={t("settings.postHangboard")}
      body={t("settings.postHangboardBody")}
      checked={false}
      disabled
      onChange={() => undefined}
    />
  );
}

function LoadedHangboardRow(): React.ReactElement {
  const { model, actions } = useHangData();
  return (
    <SwitchRow
      title={t("settings.postHangboard")}
      body={t("settings.postHangboardBody")}
      checked={model.settings.postToStrava}
      disabled={false}
      onChange={(postToStrava) => void actions.saveSettings({ postToStrava })}
    />
  );
}

/** Training's own Strava switches: hangboard sessions, and every other kind of training. */
export function TrainingStravaRows({ posting }: TrainingStravaRowsProps): React.ReactElement {
  return (
    <>
      <HangDataProvider fallback={<PendingHangboardRow />}>
        <LoadedHangboardRow />
      </HangDataProvider>
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
