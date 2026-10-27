import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@sendtally/design/tokens";
import type { HangKind, HangSetup } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { BackButton } from "../../../components/BackButton";
import { Button } from "../components/Button";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { SetupFields } from "../setup/SetupFields";

/** One item to set up: its grip, whether it hangs, and where its setup starts. */
export type SetupEntry = { gripId: string; kind: HangKind; initial: HangSetup };

export type SetupStepProps = {
  name: string;
  entries: readonly SetupEntry[];
  onStart: (setups: HangSetup[]) => void;
};

/** The edge and weight for each item of this run, checked before the clock starts. */
export function SetupStep({ name, entries, onStart }: SetupStepProps): React.ReactElement {
  const { model } = useHangData();
  const [setups, setSetups] = React.useState(() => entries.map((e) => e.initial));
  const grips = entries.map((e) => model.gripName(e.gripId));
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
            <Label color={colors.gunmetal}>
              {t("hang.setupKicker", { grip: grips.join(" · ") })}
            </Label>
            <Title size={34}>{name}</Title>
          </View>
          {entries.map((e, i) => (
            <View key={i} style={{ gap: 12 }}>
              {entries.length > 1 && <Label color={colors.gunmetal}>{grips[i]}</Label>}
              <SetupFields
                kind={e.kind}
                setup={setups[i] ?? e.initial}
                onChange={(setup) =>
                  setSetups((all) => all.map((old, j) => (j === i ? setup : old)))
                }
              />
            </View>
          ))}
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
          onPress={() => onStart(setups)}
          variant="primary"
          height={54}
          icon="play"
        />
      </View>
    </SafeAreaView>
  );
}
