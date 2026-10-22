import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@sendtally/design/tokens";
import { protocolOf, type Workout } from "@sendtally/core/hang";
import { loadLabel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Button } from "../components/Button";
import { EffortField } from "../components/EffortField";
import { Label } from "../components/Label";
import { StatGrid } from "../components/StatGrid";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { openTrends } from "../trends/openTrends";
import { type } from "../type";
import type { DoneParams } from "./doneParams";
import { doneStats, doneStatus, partialNote } from "./doneText";

function Done({ workout, params }: { workout: Workout; params: DoneParams }): React.ReactElement {
  const { model, actions, today } = useHangData();
  const [rpe, setRpe] = React.useState<number | null>(null);
  const { result, gripId, loadKg } = params;
  const load = loadLabel(workout.kind, loadKg, model.settings.units);
  const partial = result.pct < 100;

  const log = (): void => {
    void actions.saveSession({
      id: randomUUID(),
      workoutId: workout.id,
      gripId,
      date: today,
      loadKg,
      pct: result.pct,
      misses: result.misses,
      rpe,
      protocol: protocolOf(workout),
    });
    openTrends(workout.id, gripId, true);
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          gap: 20,
          paddingTop: 30,
          paddingHorizontal: 18,
          paddingBottom: 16,
        }}
      >
        <View style={{ gap: 6 }}>
          <Label color={colors.labelAccent}>
            {t("hang.kicker", { status: doneStatus(result), grip: model.gripName(gripId) })}
          </Label>
          <Title size={40}>{workout.name}</Title>
        </View>
        <StatGrid columns={2} valueSize={22} stats={doneStats(workout, result, load)} />
        {partial && (
          <Text style={[type.body, { fontSize: 14, lineHeight: 21, color: colors.textSecondary }]}>
            {partialNote(workout, result, load)}
          </Text>
        )}
        <EffortField value={rpe} onChange={setRpe} />
        <View style={{ flex: 1 }} />
        <View style={{ gap: 6 }}>
          <Button label={t("hang.logSession")} onPress={log} variant="primary" height={54} />
          <Button label={t("hang.discard")} onPress={() => router.back()} variant="danger" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function DoneScreen({ params }: { params: DoneParams }): React.ReactElement | null {
  const { model } = useHangData();
  const workout = model.workout(params.workoutId);
  return workout === undefined ? null : <Done workout={workout} params={params} />;
}
