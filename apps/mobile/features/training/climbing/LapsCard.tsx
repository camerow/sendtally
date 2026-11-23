import React from "react";
import { Pressable, Text, View } from "react-native";
import type { SessionItem, WeightUnit } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import {
  enduranceAmountLabel,
  useLapsTally,
  type LiveSession,
  type LogSessionDraft,
} from "@sendtally/features/log-session";
import { lapPlanOf } from "@sendtally/features/activities";
import { elapsedClock } from "@sendtally/features/sessions";
import { exerciseName, targetText, type RestClock } from "@sendtally/features/workouts";
import type { About } from "../components/AboutButton";
import { Stepper } from "../components/Stepper";
import type { DetailMenuRow } from "../components/types";
import { RestRow } from "../rest/RestRow";
import { ExerciseBlock } from "../sets/ExerciseBlock";
import { ExerciseHead } from "../sets/ExerciseHead";
import { SetRow, type SetRowProps } from "../sets/SetRow";
import { type } from "../type";
import { useSessionTarget } from "../sets/sessionTarget";

export type LapsCardProps = {
  item: number;
  at: SessionItem;
  /** The laps it asks for now, after any Add lap or −. */
  planned: number;
  draft: LogSessionDraft | null;
  /** The draft with the tally on this card, for a change made on it. */
  on: () => LogSessionDraft;
  live: LiveSession;
  rest: RestClock;
  now: Date;
  unit: WeightUnit;
  about?: About | undefined;
  onHistory?: (() => void) | undefined;
  onFold: () => void;
  menu: readonly DetailMenuRow[];
  /** A lap was taken out, for its Undo. */
  onLapRemoved: (lap: number) => void;
};

type LapPlan = ReturnType<typeof lapPlanOf>;

/** "28 moves", "4:30": what one lap was. */
const lapAmount = (plan: LapPlan, value: number): string =>
  enduranceAmountLabel({ ...plan, laps: [] }, value);

/** A lap's moves on − and +, out of the circuit's. */
function Moves({
  label,
  value,
  plan,
  onChange,
}: {
  label: string;
  value: number;
  plan: LapPlan;
  onChange: (moves: number) => void;
}): React.ReactElement {
  const clamp = (n: number): number => Math.min(plan.target, Math.max(0, n));
  return (
    <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6 }}>
      <Stepper
        compact
        label={t("workouts.dose.moves")}
        accessibilityLabel={`${label} · ${t("workouts.dose.moves")}`}
        value={value}
        min={0}
        max={plan.target}
        step={1}
        onChange={(n) => onChange(clamp(n))}
        onStep={(d) => onChange(clamp(value + d))}
        decreaseLabel={`${label} · ${t("tally.fewerMoves")}`}
        increaseLabel={`${label} · ${t("tally.moreMoves")}`}
        surface="plain"
      />
      <Text style={[type.mono, { fontSize: 13, color: colors.textSecondary }]}>
        {t("activities.holdOf", { time: lapAmount(plan, plan.target) })}
      </Text>
    </View>
  );
}

/** A timed lap's time, out of the lap's. */
function LapTime({ seconds, plan }: { seconds: number; plan: LapPlan }): React.ReactElement {
  return (
    <Text style={[type.monoBold, { flex: 1, fontSize: 14, color: colors.gunmetal }]}>
      {elapsedClock(seconds)}
      <Text style={[type.mono, { fontSize: 13, color: colors.textSecondary }]}>
        {` ${t("activities.holdOf", { time: elapsedClock(plan.target) })}`}
      </Text>
    </Text>
  );
}

/**
 * A circuit exercise as a row per lap, on the tally or off it: each lap ticked when off the wall,
 * its moves preset to the circuit's and lowered for a fall, then Add lap.
 */
export function LapsCard({
  item,
  at,
  planned,
  draft,
  on,
  live,
  rest,
  now,
  unit,
  about,
  onHistory,
  onFold,
  menu,
  onLapRemoved,
}: LapsCardProps): React.ReactElement {
  const sessionRpe = useSessionTarget();
  const plan = lapPlanOf(at.dose);
  const laps = useLapsTally(draft, item, planned, on, live, rest, now);
  const [moves, setMoves] = React.useState<{ lap: number; n: number } | null>(null);
  const [selected, setSelected] = React.useState<number | null>(null);
  const done = laps.laps.length;
  const nextMoves = moves?.lap === done ? moves.n : plan.target;
  const select =
    (n: number): (() => void) =>
    () =>
      setSelected(selected === n ? null : n);
  const label = (n: number): string => t("tally.lapLabel", { lap: n });
  const removeLap = laps.removeLap;
  const removable = (
    n: number
  ): Partial<Pick<SetRowProps, "selected" | "onSelect" | "onRemove">> =>
    removeLap === null
      ? {}
      : {
          selected: selected === n,
          onSelect: select(n),
          onRemove: () => {
            removeLap();
            setSelected(null);
            onLapRemoved(n);
          },
        };
  const name = exerciseName(at.exercise);
  return (
    <ExerciseBlock
      head={
        <ExerciseHead
          name={name}
          target={targetText(at.dose, "laps", unit, { sessionRpe })}
          about={about}
          {...(onHistory !== undefined && { onHistory })}
          onFold={onFold}
          menu={menu}
        />
      }
      add={{ label: t("tally.addLap"), onPress: laps.addLap }}
    >
      {laps.laps.map((value, i) => (
        <SetRow
          key={`lap${i}`}
          position={String(i + 1)}
          label={label(i + 1)}
          ticked
          onToggle={() => laps.untick(i)}
          selected={selected === i + 1}
          onSelect={select(i + 1)}
          onRemove={() => {
            laps.untick(i);
            setSelected(null);
          }}
          removeLabel={t("tally.removeLapOf", { lap: i + 1 })}
        >
          {laps.timed ? (
            <LapTime seconds={value} plan={plan} />
          ) : (
            <Moves
              label={label(i + 1)}
              value={value}
              plan={plan}
              onChange={(n) => laps.change(i, n)}
            />
          )}
        </SetRow>
      ))}
      {laps.rest !== null &&
        ("running" in laps.rest ? (
          <RestRow
            rest={laps.rest.running}
            left={laps.rest.left}
            onMore={laps.moreRest}
            onSkip={laps.skipRest}
          />
        ) : (
          <RestRow rest={null} seconds={laps.rest.seconds} onStart={laps.startRest} />
        ))}
      {done < planned && (
        <SetRow
          position={String(done + 1)}
          label={label(done + 1)}
          ticked={false}
          onToggle={() => laps.tick(nextMoves)}
          removeLabel={t("tally.removeLapOf", { lap: done + 1 })}
          {...removable(done + 1)}
        >
          {plan.unit === "seconds" ? (
            <Pressable
              style={{ flex: 1, minHeight: 44, justifyContent: "center" }}
              onPress={laps.elapsed === null ? laps.startLap : undefined}
              accessibilityRole="button"
              accessibilityLabel={`${label(done + 1)}, ${t("hang.start")}`}
            >
              <LapTime seconds={laps.elapsed ?? 0} plan={plan} />
            </Pressable>
          ) : (
            <Moves
              label={label(done + 1)}
              value={nextMoves}
              plan={plan}
              onChange={(n) => setMoves({ lap: done, n })}
            />
          )}
        </SetRow>
      )}
      {Array.from({ length: Math.max(0, planned - done - 1) }, (_, i) => done + i + 2).map((n) => (
        <SetRow
          key={`wait${n}`}
          position={String(n)}
          label={label(n)}
          removeLabel={t("tally.removeLapOf", { lap: n })}
          trailing={null}
          {...removable(n)}
        >
          {null}
        </SetRow>
      ))}
    </ExerciseBlock>
  );
}
