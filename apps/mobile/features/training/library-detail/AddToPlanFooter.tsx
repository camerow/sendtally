import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { Button } from "../components/Button";

export type AddToPlanFooterProps = { workoutId: string; children: React.ReactNode };

/** Add to plan, beside another of a workout's actions. */
export function AddToPlanFooter({ workoutId, children }: AddToPlanFooterProps): React.ReactElement {
  return (
    <View style={{ flexDirection: "row", gap: 10 }}>
      <Button
        label={t("plan.addToPlan")}
        onPress={() => router.push({ pathname: "/plan/schedule", params: { workoutId } })}
        variant="outline"
        height={48}
        style={{ flex: 1 }}
      />
      {children}
    </View>
  );
}
