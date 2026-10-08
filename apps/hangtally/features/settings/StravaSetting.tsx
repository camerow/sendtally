import React from "react";
import { t } from "@sendtally/features/i18n";
import { ToggleRow } from "../../components/ToggleRow";
import { useHangData } from "../data/HangDataContext";

/** Only offered once Strava is connected in sendtally, whose connection it posts through. */
export function StravaSetting(): React.ReactElement | null {
  const { model, actions } = useHangData();
  if (!model.data.strava.connected) return null;
  return (
    <ToggleRow
      label={t("hang.postToStrava")}
      note={t("hang.postToStravaNote")}
      value={model.settings.postToStrava}
      onChange={(postToStrava) => void actions.saveSettings({ postToStrava })}
    />
  );
}
