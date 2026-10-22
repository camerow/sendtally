import React from "react";
import { View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { Segmented } from "../../components/Segmented";

export type LogSegment = "sessions" | "projects";

export type LogSegmentsProps = {
  value: LogSegment;
  onChange: (next: LogSegment) => void;
};

export function LogSegments({ value, onChange }: LogSegmentsProps): React.ReactElement {
  return (
    <View style={{ paddingHorizontal: 18, paddingTop: 4, paddingBottom: 8 }}>
      <Segmented
        label={t("training.logView")}
        soft
        segments={[
          {
            key: "sessions",
            label: t("common.sessions"),
            on: value === "sessions",
            onPress: () => onChange("sessions"),
          },
          {
            key: "projects",
            label: t("common.projects"),
            on: value === "projects",
            onPress: () => onChange("projects"),
          },
        ]}
      />
    </View>
  );
}
