import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@sendtally/design/tokens";
import type { HangSetup, HangWorkout } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { BackButton } from "../../../components/BackButton";
import { Button } from "../components/Button";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { SetupFields } from "../setup/SetupFields";

export type SetupStepProps = {
  workout: HangWorkout;
  gripId: string;
  initial: HangSetup;
  onStart: (setup: HangSetup) => void;
};

/** The edge and weight for this run, checked before the clock starts. */
export function SetupStep({
  workout,
  gripId,
  initial,
  onStart,
}: SetupStepProps): React.ReactElement {
  const { model } = useHangData();
  const [setup, setSetup] = React.useState(initial);
  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colors.white }}>
      <View style={{ paddingHorizontal: 18, paddingTop: 6 }}>
        <BackButton />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            gap: 24,
            paddingTop: 8,
            paddingHorizontal: 18,
            paddingBottom: 24,
          }}
        >
          <View style={{ gap: 6 }}>
            <Label color={colors.labelAccent}>
              {t("hang.setupKicker", { grip: model.gripName(gripId) })}
            </Label>
            <Title size={34}>{workout.name}</Title>
          </View>
          <SetupFields kind={workout.kind} setup={setup} onChange={setSetup} />
        </ScrollView>
      </KeyboardAvoidingView>
      <View
        style={{
          paddingTop: 12,
          paddingHorizontal: 18,
          paddingBottom: 10,
          borderTopWidth: 1,
          borderTopColor: colors.lineOnLight,
        }}
      >
        <Button
          label={t("hang.start")}
          onPress={() => onStart(setup)}
          variant="primary"
          height={54}
          icon="play"
        />
      </View>
    </SafeAreaView>
  );
}
