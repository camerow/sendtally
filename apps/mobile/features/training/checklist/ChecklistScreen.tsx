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
import { logRun, runParams, type WorkoutRun } from "../data/workoutRunParams";
import { resumedRun, writeLiveRun } from "../../live-session/liveRun";
import { RestRow } from "../rest/RestRow";
import { useRest } from "../rest/useRest";
import { afterKey, allSets, setKey } from "../sets/setsRun";
import { type } from "../type";
import { ChecklistRow } from "./ChecklistRow";

/**
 * A routine to tick off line by line on a clock from Start, resting between lines; whatever is
 * ticked is what gets logged, and the form can still tick the rest.
 */
export function ChecklistScreen({
  run,
  end = false,
}: {
  run: WorkoutRun;
  /** Finishes the running workout as it opens, straight to its review. */
  end?: boolean;
}): React.ReactElement {
  const unit = useWeightUnit(useApi());
  const [resumed] = React.useState(() => {
    const live = resumedRun("/workout/checklist", run.workoutId);
    return live?.state.player === "checklist" ? { ...live.state, startedAt: live.startedAt } : null;
  });
  const [startedAt] = React.useState(() => resumed?.startedAt ?? Date.now());
  const [ticked, setTicked] = React.useState<ReadonlySet<number>>(() => new Set(resumed?.ticked));
  React.useEffect(() => {
    writeLiveRun({
      title: run.title,
      workoutId: run.workoutId,
      pathname: "/workout/checklist",
      params: runParams(run),
      startedAt,
      state: { player: "checklist", ticked: [...ticked], count: run.items.length },
    });
  }, [run, startedAt, ticked]);
  const rest = useRest();
  const toggle = (i: number): void => {
    const next = new Set(ticked);
    const ticking = !next.delete(i);
    if (ticking) next.add(i);
    setTicked(next);
    const following = run.items.findIndex((_, j) => j > i && !next.has(j));
    const name = run.items[following]?.exercise;
    if (!ticking || name === undefined) rest.skip();
    else rest.tick(afterKey(i), run.exerciseRestS, exerciseName(name));
  };
  const finish = (): void =>
    logRun(
      run,
      doneAsPrescribed(run.items),
      startedAt,
      allSets(run.items)
        .filter((at) => !ticked.has(at.item))
        .map(setKey)
    );
  const ending = React.useRef(end);
  React.useEffect(() => {
    if (!ending.current) return;
    ending.current = false;
    finish();
  });

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, gap: 16, paddingHorizontal: 18 }}>
        <PlayerHeader
          kind={run.kind}
          focus={run.link.focus}
          title={run.title}
          minutes={run.minutes}
          workoutId={run.workoutId}
          startedAt={startedAt}
        />
        <View>
          {run.items.map((item, i) => (
            <React.Fragment key={i}>
              <ChecklistRow
                name={exerciseName(item.exercise)}
                dose={doseSummary(run.kind, item.dose, unit)}
                ticked={ticked.has(i)}
                onToggle={() => toggle(i)}
              />
              {rest.rest?.at === afterKey(i) && (
                <RestRow rest={rest.rest} left={rest.left} onMore={rest.more} onSkip={rest.skip} />
              )}
            </React.Fragment>
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
