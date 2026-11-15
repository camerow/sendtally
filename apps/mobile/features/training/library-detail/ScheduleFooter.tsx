import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { Button } from "../components/Button";

export type ScheduleFooterProps = { workoutId: string; children: React.ReactNode };

/** Schedule, beside another of a workout's actions. */
export function ScheduleFooter({ workoutId, children }: ScheduleFooterProps): React.ReactElement {
  return (
    <View style={{ flexDirection: "row", gap: 10 }}>
      <Button
        label={t("plan.schedule")}
        onPress={() => router.push({ pathname: "/plan/schedule", params: { workoutId } })}
        variant="outline"
        height={48}
        style={{ flex: 1 }}
      />
      {children}
    </View>
  );
}
