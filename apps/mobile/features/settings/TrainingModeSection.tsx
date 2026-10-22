import React from "react";
import { Text, View } from "react-native";
import type { TrainingModeFeature } from "@sendtally/features/settings";
import { t } from "@sendtally/features/i18n";
import { Switch } from "../../components/Switch";
import { bodyText, messageText, sectionCard, sectionLabel } from "../../lib/styles";

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
    <View style={sectionCard}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={sectionLabel}>{t("settings.trainingMode")}</Text>
          <Text style={bodyText}>{t("settings.trainingModeBody")}</Text>
        </View>
        <Switch
          checked={trainingMode.enabled}
          onChange={onChange}
          disabled={!trainingMode.ready}
          label={t("settings.trainingMode")}
        />
      </View>
      {error !== null && <Text style={messageText}>{error}</Text>}
    </View>
  );
}
