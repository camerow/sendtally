import React from "react";
import { View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import type { WelcomeCardKey, WelcomeView } from "@sendtally/features/settings";
import { DarkWeek } from "../../components/DarkWeek";
import { KindLegend } from "../../components/KindLegend";
import { RangeChips } from "../../components/RangeChips";
import { SamplePyramid } from "../../components/SamplePyramid";
import { SampleExerciseHead } from "../billing/SampleExerciseHead";
import { ClimbLogRow } from "../climbs/ClimbLogRow";
import { LoadBars } from "../first-run/plan/components/LoadBars";
import { ExerciseTrendCard } from "../training/exercises/ExerciseTrendCard";
import { LoadCard } from "../training/insights/LoadCard";
import { RestPreview } from "../training/rest/RestPreview";
import { RepDots } from "../training/timer/RepDots";
import { RunProgressBar } from "../training/timer/RunProgressBar";
import { TimerColumn } from "../training/timer/TimerColumn";
import { TimerRing } from "../training/timer/TimerRing";
import { FillHeight } from "./FillHeight";
import { WholeRows } from "./WholeRows";

const still = (): void => undefined;

/** A welcome card's picture, drawn by the screens it shows, filling the height its card gives it. */
export function WelcomeArt({
  card,
  view,
  width,
}: {
  card: WelcomeCardKey;
  view: WelcomeView;
  /** The picture's width, which caps the timer's ring. */
  width: number;
}): React.ReactElement {
  const progress = useSharedValue(view.timer.progress);
  const { timer } = view;
  switch (card) {
    case "blocks":
      return (
        <FillHeight min={24}>
          {(height) => (
            <View style={{ gap: 14 }}>
              <KindLegend items={view.legend.map((l) => ({ key: l.kind, ...l }))} />
              <DarkWeek week={view.week} />
              <LoadBars bars={view.bars} height={height} />
            </View>
          )}
        </FillHeight>
      );
    case "workouts":
      return (
        <WholeRows
          center
          rows={view.exercises.map((e, i) =>
            i === 0 ? (
              <SampleExerciseHead name={e.name} work={e.work} />
            ) : (
              <View style={{ paddingTop: 10, gap: 10 }}>
                <RestPreview seconds={e.restBeforeS} />
                <SampleExerciseHead name={e.name} work={e.work} />
              </View>
            )
          )}
        />
      );
    case "hangboard":
      return (
        <FillHeight min={96} max={width}>
          {(size) => (
            <View style={{ gap: 14 }}>
              <RunProgressBar run={timer.run} progress={progress} />
              <TimerColumn
                gap={10}
                grip={timer.grip}
                setLine={timer.setLine}
                ring={
                  <TimerRing
                    size={size}
                    progress={progress}
                    color={timer.look.mark}
                    labelColor={timer.look.fill}
                    phaseKey={timer.run.index}
                    label={timer.label}
                    big={timer.big}
                    accessibilityLabel={timer.label}
                    onPress={still}
                  />
                }
                dots={<RepDots reps={timer.reps} marks={timer.run.marks} working />}
              />
            </View>
          )}
        </FillHeight>
      );
    case "metrics":
      return (
        <FillHeight min={48}>
          {(height) => (
            <ExerciseTrendCard
              series={view.e1rm}
              chart="e1rm"
              unit={view.unit}
              chartHeight={height}
              bare
            />
          )}
        </FillHeight>
      );
    case "load":
      return (
        <FillHeight min={48}>
          {(height) => <LoadCard load={view.load} plotHeight={height} bare />}
        </FillHeight>
      );
    case "log":
      return (
        <View style={{ flex: 1, gap: 12 }}>
          <View>
            <RangeChips shown="all" onPick={still} years={view.years} />
          </View>
          <SamplePyramid tone="light" counts={false} />
          <WholeRows
            rows={view.climbs.map((climb, i) => (
              <ClimbLogRow row={{ ...climb, id: `sample-${i}`, pill: null }} onPress={null} />
            ))}
          />
        </View>
      );
  }
}
