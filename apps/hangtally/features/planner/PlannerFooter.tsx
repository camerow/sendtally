import React from "react";
import { Text, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { Button } from "../../components/Button";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";
import type { Planner } from "./usePlanner";

/** The summary and actions, pinned under the scrolling planner. */
export function PlannerFooter({ planner }: { planner: Planner }): React.ReactElement {
  const c = useTheme();
  return (
    <View style={{ gap: 10 }}>
      <Text style={[type.mono, { fontSize: 13, lineHeight: 19, color: c.ink2 }]}>
        {planner.summary}
      </Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {planner.isEdit && (
          <Button
            label={t("hang.remove")}
            onPress={planner.remove}
            variant="outlineLight"
            height={54}
          />
        )}
        <Button
          label={planner.isEdit ? t("hang.saveChanges") : t("hang.addToSchedule")}
          onPress={planner.save}
          variant="ink"
          height={54}
          disabled={!planner.ready}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}
