import { router } from "expo-router";
import React from "react";
import { View } from "react-native";
import { clock, type HangWorkout } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { hangLoadText } from "@sendtally/features/activities";
import { humanDuration } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { PhaseBar } from "../components/PhaseBar";
import { StatGrid } from "../components/StatGrid";
import { useHangData } from "../data/HangDataContext";
import { ExerciseBlock } from "../sets/ExerciseBlock";
import { ExerciseHead } from "../sets/ExerciseHead";
import { Swatch } from "./Swatch";

export type ProtocolPanelProps = { workout: HangWorkout; gripId: string };

/** A hangboard workout's grip on its page: its session as labelled numbers, then the phase bar. */
export function ProtocolPanel({ workout, gripId }: ProtocolPanelProps): React.ReactElement {
  const { model } = useHangData();
  const hang = workout.kind === "hang";
  const setup = model.setup(workout, gripId);
  const stats = [
    { label: t("hang.statSets"), value: String(workout.sets) },
    hang
      ? { label: t("hang.statHangsASet"), value: String(workout.reps) }
      : { label: t("plan.colReps"), value: String(workout.reps) },
    ...(hang
      ? [
          {
            label: t("hang.statOnOff"),
            value:
              workout.reps > 1
                ? `${humanDuration(workout.hangS)} / ${humanDuration(workout.restS)}`
                : humanDuration(workout.hangS),
          },
        ]
      : []),
    { label: t("plan.colSetRest"), value: clock(workout.setRestS) },
    ...(hang ? [{ label: t("plan.colEdge"), value: t("hang.edgeMm", { n: setup.edgeMm }) }] : []),
    { label: t("hang.load"), value: hangLoadText(setup.loadKg, model.settings.units) },
  ];
  return (
    <ExerciseBlock
      head={
        <ExerciseHead
          name={model.gripName(gripId)}
          onHistory={() => router.push({ pathname: "/grip/[id]", params: { id: gripId } })}
        />
      }
    >
      <StatGrid stats={stats} valueSize={16} />
      <View style={{ flexDirection: "row", paddingTop: 12 }}>
        <PhaseBar protocol={workout} height={14} />
      </View>
      <View style={{ flexDirection: "row", gap: 12, paddingTop: 6 }}>
        <Swatch color={colors.azure} label={hang ? t("hang.kindHang") : t("hang.lifts")} />
        <Swatch color={colors.fern} label={t("hang.rest")} short />
      </View>
    </ExerciseBlock>
  );
}
