import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { clock, doneAsPrescribed, type ItemDone, type SetDone } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { useWeightUnit } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { PlayerHeader } from "../components/PlayerHeader";
import { logRun, type WorkoutRun } from "../data/workoutRunParams";
import { type } from "../type";
import { SetsCard } from "./SetsCard";
import { allSets, restAfter, setKey, tickedDone, type SetAt } from "./setsRun";
import { useCountdown } from "./useCountdown";

/** A lifting workout as a set table: tick each set as it is done, rest between, then log what was done. */
export function SetsScreen({ run }: { run: WorkoutRun }): React.ReactElement {
  const unit = useWeightUnit(useApi());
  const [startedAt] = React.useState(Date.now);
  const [done, setDone] = React.useState<ItemDone[]>(() => doneAsPrescribed(run.items));
  const [ticked, setTicked] = React.useState<ReadonlySet<string>>(new Set());
  const rest = useCountdown();
  const resting = rest.secondsLeft;
  const sets = allSets(run.items);
  const current = sets.find((at) => !ticked.has(setKey(at))) ?? null;

  const toggle = (at: SetAt): void => {
    const key = setKey(at);
    const next = new Set(ticked);
    if (next.delete(key)) {
      setTicked(next);
      return;
    }
    next.add(key);
    setTicked(next);
    rest.start(next.size === sets.length ? 0 : restAfter(run.items, at, run.exerciseRestS));
  };
  const change = (item: number, set: number, value: SetDone): void =>
    setDone((all) =>
      all.map((d) =>
        d.item === item ? { ...d, sets: d.sets.map((s, i) => (i === set ? value : s)) } : d
      )
    );
  const finish = (): void =>
    logRun(
      run,
      tickedDone(done, ticked),
      Math.max(1, Math.round((Date.now() - startedAt) / 60_000))
    );

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colors.white }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: 12, paddingHorizontal: 18, paddingBottom: 24 }}
        >
          <PlayerHeader
            kind={run.kind}
            title={run.title}
            minutes={run.minutes}
            aside={
              resting > 0 && (
                <View
                  accessibilityLiveRegion="polite"
                  style={{
                    height: 36,
                    paddingHorizontal: 12,
                    borderRadius: 18,
                    justifyContent: "center",
                    backgroundColor: colors.gunmetal,
                  }}
                >
                  <Text style={[type.monoBold, { fontSize: 14, color: colors.gold }]}>
                    {t("activities.restFor", { time: clock(resting, true) })}
                  </Text>
                </View>
              )
            }
          />
          {run.items.map((item, i) => {
            const d = done[i];
            return d === undefined ? null : (
              <SetsCard
                key={i}
                item={item}
                done={d}
                ticked={ticked}
                current={current}
                unit={unit}
                onChange={(set, value) => change(i, set, value)}
                onToggle={(set) => toggle({ item: i, set })}
              />
            );
          })}
        </ScrollView>
        <View
          style={{
            paddingTop: 12,
            paddingHorizontal: 18,
            paddingBottom: 10,
            borderTopWidth: 1,
            borderTopColor: colors.lineOnLight,
          }}
        >
          <Button label={t("activities.finish")} onPress={finish} variant="primary" height={54} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
