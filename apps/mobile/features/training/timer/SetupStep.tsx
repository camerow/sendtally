import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import type { HangKind, HangSetup } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { ScreenFrame } from "../../../components/ScreenFrame";
import { Button } from "../components/Button";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { WorkoutNotes } from "../components/WorkoutNotes";
import { useHangData } from "../data/HangDataContext";
import { SetupFields } from "../setup/SetupFields";

/** One item to set up: its grip, whether it hangs, and where its setup starts. */
export type SetupEntry = { gripId: string; kind: HangKind; initial: HangSetup };

export type SetupStepProps = {
  name: string;
  workoutId: string;
  entries: readonly SetupEntry[];
  onStart: (setups: HangSetup[]) => void;
};

/** The edge and weight for each item of this run, checked before the clock starts. */
export function SetupStep({
  name,
  workoutId,
  entries,
  onStart,
}: SetupStepProps): React.ReactElement {
  const { model } = useHangData();
  const [setups, setSetups] = React.useState(() => entries.map((e) => e.initial));
  const grips = entries.map((e) => model.gripName(e.gripId));
  return (
    <ScreenFrame
      footer={
        <Button
          label={t("hang.start")}
          onPress={() => onStart(setups)}
          variant="primary"
          height={54}
          icon="play"
        />
      }
    >
      <View style={{ gap: 6 }}>
        <Label color={colors.gunmetal}>{t("hang.setupKicker", { grip: grips.join(" · ") })}</Label>
        <Title size={34}>{name}</Title>
        <WorkoutNotes workoutId={workoutId} />
      </View>
      {entries.map((e, i) => (
        <View key={i} style={{ gap: 12 }}>
          {entries.length > 1 && <Label color={colors.gunmetal}>{grips[i]}</Label>}
          <SetupFields
            kind={e.kind}
            setup={setups[i] ?? e.initial}
            onChange={(setup) => setSetups((all) => all.map((old, j) => (j === i ? setup : old)))}
          />
        </View>
      ))}
    </ScreenFrame>
  );
}
