import React from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@sendtally/design/tokens";
import { useWeightUnit } from "@sendtally/features/activities";
import { eachSideOf } from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import { useExercises } from "@sendtally/features/statistics";
import {
  afterKey,
  doseSummary,
  exerciseName,
  heldSeconds,
  useChecklistPlayer,
  type WorkoutRun,
} from "@sendtally/features/workouts";
import { useApi } from "../../../lib/api";
import { liveRun } from "../../live-session/liveRun";
import { Button } from "../components/Button";
import { PlayerHeader } from "../components/PlayerHeader";
import { logRun } from "../data/workoutRunParams";
import { HoldButton } from "../hold/HoldButton";
import { HoldRow } from "../hold/HoldRow";
import { RestPreview } from "../rest/RestPreview";
import { RestRow } from "../rest/RestRow";
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
  const api = useApi();
  const unit = useWeightUnit(api);
  const exercises = useExercises(api).state;
  const sided = eachSideOf(exercises.status === "ready" ? exercises.data : []);
  const player = useChecklistPlayer(run, liveRun, sided);
  const { startedAt, ticked, rest, hold, toggle, endHold } = player;

  const finish = (): void => {
    const { done, off } = player.finished();
    logRun(run, done, startedAt, off);
  };
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
          title={run.title}
          workoutId={run.workoutId}
          startedAt={startedAt}
        />
        <View>
          {run.items.map((item, i) => (
            <React.Fragment key={i}>
              {hold.hold?.at === String(i) ? (
                <View style={{ gap: 4, paddingTop: 6, paddingBottom: 6 }}>
                  <Text style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>
                    {exerciseName(item.exercise)}
                  </Text>
                  <HoldRow
                    hold={hold.hold}
                    now={hold.now}
                    onPause={hold.pause}
                    onResume={hold.resume}
                    onDone={() => {
                      if (hold.hold !== null)
                        endHold(hold.hold, heldSeconds(hold.hold, Date.now()));
                    }}
                  />
                </View>
              ) : (
                <ChecklistRow
                  name={exerciseName(item.exercise)}
                  dose={doseSummary(run.kind, item.dose, unit, sided(item.exercise))}
                  ticked={ticked.has(i)}
                  onToggle={() => toggle(i)}
                  go={(() => {
                    const targetS = player.holdTarget(i);
                    return (
                      targetS !== null && (
                        <HoldButton
                          name={exerciseName(item.exercise)}
                          targetS={targetS}
                          onPress={() => player.startHold(i)}
                        />
                      )
                    );
                  })()}
                />
              )}
              {rest.rest?.at === afterKey(i) ? (
                <View style={{ paddingVertical: 6 }}>
                  <RestRow
                    rest={rest.rest}
                    left={rest.left}
                    onMore={rest.more}
                    onSkip={rest.skip}
                  />
                </View>
              ) : (
                i < run.items.length - 1 &&
                run.exerciseRestS > 0 && <RestPreview seconds={run.exerciseRestS} />
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
