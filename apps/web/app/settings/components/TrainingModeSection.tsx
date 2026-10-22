import React from "react";
import type { TrainingModeFeature } from "@sendtally/features/settings";
import { t } from "@sendtally/features/i18n";
import { bodyText, messageText, sectionLabel } from "./styles";
import { Switch } from "./Switch";

export type TrainingModeSectionProps = {
  trainingMode: TrainingModeFeature;
};

export function TrainingModeSection({
  trainingMode,
}: TrainingModeSectionProps): React.ReactElement {
  const [error, setError] = React.useState<string | null>(null);
  const onChange = React.useCallback(
    (next: boolean) => {
      setError(null);
      trainingMode
        .setEnabled(next)
        .catch((err: unknown) =>
          setError(err instanceof Error ? err.message : t("common.somethingWentWrong"))
        );
    },
    [trainingMode]
  );

  return (
    <>
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}
      >
        <span style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 420 }}>
          <span style={sectionLabel}>{t("settings.trainingMode")}</span>
          <p style={bodyText}>{t("settings.trainingModeBody")}</p>
          <p style={bodyText}>{t("settings.trainingModeWebHint")}</p>
        </span>
        <Switch
          checked={trainingMode.enabled}
          onChange={onChange}
          disabled={!trainingMode.ready}
          label={t("settings.trainingMode")}
        />
      </div>
      {error !== null && <span style={messageText}>{error}</span>}
    </>
  );
}
