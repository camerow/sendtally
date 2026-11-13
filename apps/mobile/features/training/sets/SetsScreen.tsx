import { router } from "expo-router";
import React from "react";
import { KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@sendtally/design/tokens";
import {
  climbingLastTime,
  climbsLine,
  lapsLine,
  useActivities,
  useWeightUnit,
  wallLine,
} from "@sendtally/features/activities";
import type { TallyMeasure } from "@sendtally/features/exercises";
import { formatNumber, t } from "@sendtally/features/i18n";
import { useLiveSession } from "@sendtally/features/log-session";
import { useExercises } from "@sendtally/features/statistics";
import {
  afterKey,
  heldSeconds,
  setKey,
  useSetsPlayer,
  type SetAt,
  type WorkoutRun,
} from "@sendtally/features/workouts";
import { KeypadScrollView } from "../../../components/KeypadScrollView";
import { useApi } from "../../../lib/api";
import { exerciseTallyStorage } from "../../../lib/exerciseTallyStorage";
import { liveRun } from "../../live-session/liveRun";
import { Button } from "../components/Button";
import { PlayerHeader } from "../components/PlayerHeader";
import { logRun } from "../data/workoutRunParams";
import { HoldButton } from "../hold/HoldButton";
import { HoldRow } from "../hold/HoldRow";
import { RestPreview } from "../rest/RestPreview";
import { RestRow } from "../rest/RestRow";
import { type } from "../type";
import { ClimbingCard } from "./ClimbingCard";
import { FoldedSetsCard } from "./FoldedSetsCard";
import { SET_COLUMNS } from "./setColumns";
import { SetsCard } from "./SetsCard";

/**
 * A lifting workout as a set table on a clock from Start: tick each set as it is done, rest
 * in line after it, then log what was done. A climbing exercise is a card instead, whose Start
 * logs it on the session tally; its climbs come back as its sets.
 */
export function SetsScreen({
  run,
  end = false,
}: {
  run: WorkoutRun;
  /** Finishes the running workout as it opens, straight to its review. */
  end?: boolean;
}): React.ReactElement {
  const api = useApi();
  const unit = useWeightUnit(api);
  const { state: activities } = useActivities(api);
  const exercises = useExercises(api).state;
  const tally = useLiveSession(exerciseTallyStorage);
  const [keypad, setKeypad] = React.useState(false);
  const player = useSetsPlayer({
    run,
    store: liveRun,
    tally,
    activities: activities.status === "ready" ? activities.data : null,
    exercises: exercises.status === "ready" ? exercises.data : null,
  });
  const { shown, ticked, current, rest, hold, tallyOf, previous, nameOf } = player;

  const holdRow = (at: SetAt): React.ReactNode =>
    hold.hold?.at === setKey(at) && (
      <HoldRow
        hold={hold.hold}
        now={hold.now}
        lead={
          <Text style={[type.monoBold, SET_COLUMNS.set, { fontSize: 14, color: colors.gunmetal }]}>
            {formatNumber(at.set + 1)}
          </Text>
        }
        onPause={hold.pause}
        onResume={hold.resume}
        onDone={() => {
          if (hold.hold !== null) player.endHold(hold.hold, heldSeconds(hold.hold, Date.now()));
        }}
      />
    );
  const go = (at: SetAt): React.ReactNode => {
    const targetS = run.items[at.item]?.dose.onS;
    const name = nameOf(at.item);
    return (
      hold.hold === null &&
      current?.item === at.item &&
      current.set === at.set &&
      targetS !== undefined &&
      targetS > 0 && (
        <HoldButton
          name={name}
          targetS={targetS}
          onPress={() =>
            hold.start(setKey(at), name, targetS, player.sided(run.items[at.item]?.exercise ?? ""))
          }
        />
      )
    );
  };
  const restAt = (key: string): React.ReactNode =>
    rest.rest?.at === key && (
      <RestRow rest={rest.rest} left={rest.left} onMore={rest.more} onSkip={rest.skip} />
    );
  const restBetween = (item: number): React.ReactNode =>
    restAt(afterKey(item)) ||
    (item < run.items.length - 1 && run.exerciseRestS > 0 && (
      <RestPreview seconds={run.exerciseRestS} />
    ));
  const finish = (): void => {
    const { done, off } = player.finished();
    logRun(run, done, player.startedAt, off);
  };
  const ending = React.useRef(end);
  const loaded = exercises.status !== "loading" && activities.status !== "loading";
  React.useEffect(() => {
    if (!ending.current || !loaded) return;
    ending.current = false;
    finish();
  });
  const startClimbing = (item: number, measure: TallyMeasure): void => {
    player.startClimbing(item, measure);
    router.push("/workout/tally");
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colors.white }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <KeypadScrollView
          onKeypadChange={setKeypad}
          contentContainerStyle={{ gap: 10, paddingHorizontal: 18, paddingBottom: 24 }}
        >
          <PlayerHeader
            kind={run.kind}
            title={run.title}
            workoutId={run.workoutId}
            startedAt={player.startedAt}
          />
          {run.items.map((item, i) => {
            const d = shown[i];
            if (d === undefined) return null;
            const measure = tallyOf(i);
            if (measure !== null) {
              const logged = player.climbedSets(i);
              return (
                <ClimbingCard
                  key={i}
                  item={item}
                  measure={measure}
                  lastTime={climbingLastTime(previous(d.exercise), measure, item.dose)}
                  logged={
                    logged.length === 0
                      ? null
                      : measure === "laps"
                        ? lapsLine(logged, item.dose)
                        : measure === "wallTime"
                          ? wallLine(logged)
                          : climbsLine(logged)
                  }
                  live={tally.stored?.draft.exercise?.item === i}
                  onStart={() => startClimbing(i, measure)}
                />
              );
            }
            const folded = player.folded(i);
            return (
              <React.Fragment key={i}>
                {folded ? (
                  <FoldedSetsCard
                    name={nameOf(i)}
                    sets={item.dose.sets}
                    onOpen={() => player.open(i)}
                  />
                ) : (
                  <SetsCard
                    item={item}
                    done={d}
                    previous={previous(d.exercise)}
                    lifting={player.lifting(i)}
                    ticked={ticked}
                    current={current}
                    unit={unit}
                    onChange={(set, value) => player.change(i, set, value)}
                    onToggle={(set) => player.toggle({ item: i, set })}
                    holdRow={(set) => holdRow({ item: i, set })}
                    go={(set) => go({ item: i, set })}
                    restUnder={(set) => restAt(setKey({ item: i, set }))}
                  />
                )}
                {restBetween(i)}
              </React.Fragment>
            );
          })}
        </KeypadScrollView>
        {!keypad && (
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
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
