import React from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { doneAsPrescribed } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { useWeightUnit } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { doseSummary, exerciseName } from "@sendtally/features/workouts";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { PlayerHeader } from "../components/PlayerHeader";
import { logRun, type WorkoutRun } from "../data/workoutRunParams";
import { type } from "../type";
import { ChecklistRow } from "./ChecklistRow";

/** A routine to tick off line by line; whatever is ticked is what gets logged. */
export function ChecklistScreen({ run }: { run: WorkoutRun }): React.ReactElement {
  const unit = useWeightUnit(useApi());
  const [ticked, setTicked] = React.useState<ReadonlySet<number>>(new Set());
  const toggle = (i: number): void =>
    setTicked((was) => {
      const next = new Set(was);
      if (!next.delete(i)) next.add(i);
      return next;
    });
  const finish = (): void =>
    logRun(
      run,
      doneAsPrescribed(run.items).filter((d) => ticked.has(d.item)),
      null
    );

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, gap: 16, paddingHorizontal: 18 }}>
        <PlayerHeader kind={run.kind} title={run.title} minutes={run.minutes} />
        <View>
          {run.items.map((item, i) => (
            <ChecklistRow
              key={i}
              name={exerciseName(item.exercise)}
              dose={doseSummary(run.kind, item.dose, unit)}
              ticked={ticked.has(i)}
              onToggle={() => toggle(i)}
            />
          ))}
        </View>
      </ScrollView>
      <View style={{ gap: 6, paddingTop: 12, paddingHorizontal: 18, paddingBottom: 10 }}>
        <Button
          label={t("activities.doneForToday")}
          onPress={finish}
          variant="primary"
          height={54}
        />
        <Text
          style={[type.body, { fontSize: 13, textAlign: "center", color: colors.textSecondary }]}
        >
          {t("activities.partialCounts")}
        </Text>
      </View>
    </SafeAreaView>
  );
}
