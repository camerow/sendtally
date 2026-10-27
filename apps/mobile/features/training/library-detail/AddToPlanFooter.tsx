import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { Button } from "../components/Button";

export type AddToPlanFooterProps = { workoutId: string; children: React.ReactNode };

/** A workout's footer: Add to plan beside its start button. */
export function AddToPlanFooter({ workoutId, children }: AddToPlanFooterProps): React.ReactElement {
  return (
    <View style={{ flexDirection: "row", gap: 10 }}>
      <Button
        label={t("plan.addToPlan")}
        onPress={() => router.push({ pathname: "/plan/schedule", params: { workoutId } })}
        variant="outline"
        height={54}
      />
      {children}
    </View>
  );
}
