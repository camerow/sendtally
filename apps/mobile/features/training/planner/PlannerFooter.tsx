import React from "react";
import { Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { Button } from "../components/Button";
import { type } from "../type";
import type { Planner } from "./usePlanner";

/** The summary and actions, pinned under the scrolling planner. */
export function PlannerFooter({ planner }: { planner: Planner }): React.ReactElement {
  return (
    <View style={{ gap: 10 }}>
      <View
        style={{
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: 12,
          backgroundColor: colors.surfaceSoft,
        }}
      >
        <Text style={[type.mono, { fontSize: 13, lineHeight: 19, color: colors.gunmetal }]}>
          {planner.summary}
        </Text>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {planner.isEdit && (
          <Button label={t("hang.remove")} onPress={planner.remove} variant="outline" height={54} />
        )}
        <Button
          label={planner.isEdit ? t("hang.saveChanges") : t("hang.addToSchedule")}
          onPress={planner.save}
          variant="primary"
          height={54}
          disabled={!planner.ready}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}
