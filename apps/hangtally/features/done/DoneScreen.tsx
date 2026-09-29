import { router } from "expo-router";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { protocolOf, type Workout } from "@sendtally/core/hang";
import { loadLabel } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Button } from "../../components/Button";
import { Label } from "../../components/Label";
import { StatGrid } from "../../components/StatGrid";
import { Title } from "../../components/Title";
import { newId } from "../../lib/ids";
import { useTheme } from "../../theme/ThemeContext";
import { type } from "../../theme/type";
import { useHangData } from "../data/HangDataContext";
import { EffortField } from "../session-editor/EffortField";
import { openTrends } from "../trends/openTrends";
import type { DoneParams } from "./doneParams";
import { doneStats, doneStatus, partialNote } from "./doneText";

function Done({ workout, params }: { workout: Workout; params: DoneParams }): React.ReactElement {
  const c = useTheme();
  const { model, actions, today } = useHangData();
  const [rpe, setRpe] = React.useState<number | null>(null);
  const { result, gripId, loadKg } = params;
  const load = loadLabel(workout.kind, loadKg, model.settings.units);
  const partial = result.pct < 100;

  const log = (): void => {
    void actions.saveSession({
      id: newId(),
      workoutId: workout.id,
      gripId,
      date: today,
      loadKg,
      pct: result.pct,
      misses: result.misses,
      rpe,
      protocol: protocolOf(workout),
    });
    openTrends(workout.id, gripId);
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: c.ground }}>
      <ScrollView
        contentContainerStyle={{
          gap: 22,
          paddingTop: 40,
          paddingHorizontal: 20,
          paddingBottom: 28,
        }}
      >
        <View style={{ gap: 6 }}>
          <Label color={c.accent}>
            {t("hang.kicker", { status: doneStatus(result), grip: model.gripName(gripId) })}
          </Label>
          <Title size={44} color={c.onDark}>
            {workout.name}
          </Title>
        </View>
        <StatGrid columns={2} stats={doneStats(workout, result, load)} />
        {partial && (
          <View
            style={{
              gap: 8,
              padding: 16,
              borderRadius: 16,
              borderWidth: 1.5,
              borderStyle: "dashed",
              borderColor: c.onDark3,
            }}
          >
            <Label color={c.rest}>{t("hang.partialTitle", { pct: result.pct })}</Label>
            <Text style={[type.body, { fontSize: 14, lineHeight: 21, color: c.onDark2 }]}>
              {partialNote(workout, result, load)}
            </Text>
          </View>
        )}
        <EffortField value={rpe} onChange={setRpe} surface="dark" />
        <View style={{ gap: 10, paddingTop: 8 }}>
          <Button label={t("hang.logSession")} onPress={log} variant="accent" height={56} />
          <Button label={t("hang.discard")} onPress={() => router.navigate("/")} variant="ghost" />
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
