import React from "react";
import { Pressable, Text, View } from "react-native";
import type { SessionItem, SetDone, WeightUnit } from "@sendtally/core/hang";
import { colors, radius } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import {
  enduranceAmountLabel,
  useLapsTally,
  type LiveSession,
  type LogSessionDraft,
} from "@sendtally/features/log-session";
import { lapPlanOf } from "@sendtally/features/activities";
import type { RestClock } from "@sendtally/features/workouts";
import { press } from "../../../lib/press";
import type { About } from "../components/AboutButton";
import { Button } from "../components/Button";
import type { DetailMenuRow } from "../components/types";
import { RestRow } from "../rest/RestRow";
import { ExerciseBlock } from "../sets/ExerciseBlock";
import { ExerciseHead } from "../sets/ExerciseHead";
import { SetRow, type SetRowProps } from "../sets/SetRow";
import { exerciseName, targetText } from "@sendtally/features/workouts";
import { type } from "../type";

export type LapsCardProps = {
  item: number;
  at: SessionItem;
  /** The laps logged so far, for a card the tally is not on. */
  logged: readonly SetDone[];
  /** The laps it asks for now, after any + Add lap or −. */
  planned: number;
  /** The tally's draft while it is on this card. */
  draft: LogSessionDraft | null;
  live: LiveSession;
  rest: RestClock;
  now: Date;
  unit: WeightUnit;
  about?: About | undefined;
  onHistory?: (() => void) | undefined;
  onFold: () => void;
  menu: readonly DetailMenuRow[];
  /** A lap still to climb was taken out, for its Undo. */
  onLapRemoved: (lap: number) => void;
};

/** A lap climbed: what it was, in neutral ink whether or not it reached the target. */
function LapRow({ n, value }: { n: number; value: string }): React.ReactElement {
  return (
    <SetRow position={String(n)} label={`${t("tally.lapLabel", { lap: n })}, ${value}`} ticked>
      <Text style={[type.monoBold, { fontSize: 14, color: colors.gunmetal }]}>{value}</Text>
    </SetRow>
  );
}

const STEP = {
  width: 36,
  height: 36,
  borderRadius: radius.control,
  borderWidth: 1,
  borderColor: colors.lineOnLightStrong,
  backgroundColor: colors.white,
  alignItems: "center",
  justifyContent: "center",
} as const;

/** A lap still to climb; selected, it can be taken out. */
function Waiting({
  n,
  ...select
}: { n: number } & Pick<SetRowProps, "selected" | "onSelect" | "onRemove">): React.ReactElement {
  return (
    <SetRow
      position={String(n)}
      label={t("tally.lapLabel", { lap: n })}
      removeLabel={t("tally.removeLapOf", { lap: n })}
      {...select}
    >
      {null}
    </SetRow>
  );
}

/** The lap on the wall: Attempt or Sent, and an Attempt asks in the row how far it got. */
function LiveLaps({
  draft,
  live,
  rest,
  now,
  plan,
  onLapRemoved,
}: {
  draft: LogSessionDraft;
  live: LiveSession;
  rest: RestClock;
  now: Date;
  plan: LapPlan;
  onLapRemoved: (lap: number) => void;
}): React.ReactElement | null {
  const laps = useLapsTally(draft, live, rest, now);
  const [stepAt, setStepAt] = React.useState<{ lap: number; n: number } | null>(null);
  const [selected, setSelected] = React.useState<number | null>(null);
  if (laps === null) return null;
  const done = laps.rows.length;
  const step = stepAt?.lap === done ? stepAt.n : null;
  const setStep = (n: number | null): void => setStepAt(n === null ? null : { lap: done, n });
  const removeLap = laps.removeLap;
  const amounts = laps.circuit?.endurance?.laps ?? [];
  const waiting = Array.from(
    { length: Math.max(0, laps.planned - done - 1) },
    (_, i) => done + i + 2
  );
  const removable = (n: number): Pick<SetRowProps, "selected" | "onSelect" | "onRemove"> =>
    removeLap === null
      ? {}
      : {
          selected: selected === n,
          onSelect: () => setSelected(selected === n ? null : n),
          onRemove: () => {
            removeLap();
            setSelected(null);
            onLapRemoved(n);
          },
        };
  return (
    <>
      {laps.rows.map((_, i) => (
        <LapRow key={i} n={i + 1} value={lapAmount(plan, amounts[i] ?? 0)} />
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
      {laps.next !== null &&
        (step !== null ? (
          <SetRow
            position={String(done + 1)}
            label={laps.next.label}
            trailing={
              <Button
                label={t("common.save")}
                onPress={() => {
                  laps.attemptAt(step);
                  setStep(null);
                }}
                variant="primary"
                height={40}
              />
            }
          >
            <Text style={[type.body, { fontSize: 13, color: colors.textSecondary }]}>
              {t("tally.attempt")}
            </Text>
            <View
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Pressable
                onPress={() => setStep(Math.max(0, step - 1))}
                accessibilityRole="button"
                accessibilityLabel={t("tally.fewerMoves")}
                hitSlop={4}
                style={press(STEP)}
              >
                <Text style={[type.bodyBold, { fontSize: 20, color: colors.gunmetal }]}>−</Text>
              </Pressable>
              <Text style={[type.monoBold, { fontSize: 15, color: colors.gunmetal }]}>
                {`${step}/${plan.target}`}
              </Text>
              <Pressable
                onPress={() => setStep(Math.min(plan.target - 1, step + 1))}
                accessibilityRole="button"
                accessibilityLabel={t("tally.moreMoves")}
                hitSlop={4}
                style={press(STEP)}
              >
                <Text style={[type.bodyBold, { fontSize: 20, color: colors.gunmetal }]}>+</Text>
              </Pressable>
            </View>
          </SetRow>
        ) : laps.next.startable ? (
          <SetRow
            position={String(done + 1)}
            label={laps.next.label}
            trailing={
              <Button
                label={t("tally.startLap")}
                onPress={laps.startLap}
                variant="outline"
                height={40}
              />
            }
          >
            {null}
          </SetRow>
        ) : (
          <SetRow
            position={String(done + 1)}
            label={laps.next.label}
            removeLabel={t("tally.removeLapOf", { lap: done + 1 })}
            {...removable(done + 1)}
          >
            <Text style={[type.mono, { flex: 1, fontSize: 13, color: colors.textSecondary }]}>
              {laps.next.text}
            </Text>
          </SetRow>
        ))}
      {laps.next !== null && step === null && !laps.next.startable && (
        <View style={{ flexDirection: "row", gap: 8, paddingTop: 2, paddingBottom: 6 }}>
          <View style={{ flex: 1 }}>
            <Button
              label={t("tally.attempt")}
              onPress={() => {
                if (laps.timed) laps.fell();
                else setStep(0);
              }}
              disabled={laps.off}
              variant="outline"
              height={44}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={t("common.sent")}
              onPress={laps.sent}
              disabled={laps.off}
              variant="primary"
              height={44}
            />
          </View>
        </View>
      )}
      {waiting.map((n) => (
        <Waiting key={n} n={n} {...removable(n)} />
      ))}
      <View style={{ flexDirection: "row", paddingTop: 6 }}>
        <Button
          label={t("tally.addLap")}
          onPress={laps.addLap}
          variant="outline"
          icon="plus"
          height={40}
        />
      </View>
    </>
  );
}

type LapPlan = ReturnType<typeof lapPlanOf>;

/** "28 moves", "4:30": what one lap was. */
const lapAmount = (plan: LapPlan, value: number): string =>
  enduranceAmountLabel({ ...plan, laps: [] }, value);

/** A circuit exercise as a row per lap: what each was, the lap on the wall, and + Add lap. */
export function LapsCard({
  item,
  at,
  logged,
  planned,
  draft,
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
  const plan = lapPlanOf(at.dose);
  const active = draft?.exercise?.item === item;
  return (
    <ExerciseBlock
      head={
        <ExerciseHead
          name={exerciseName(at.exercise)}
          target={targetText(at.dose, "laps", unit)}
          about={about}
          {...(onHistory !== undefined && { onHistory })}
          onFold={onFold}
          menu={menu}
        />
      }
    >
      {active && draft !== null ? (
        <LiveLaps
          draft={draft}
          live={live}
          rest={rest}
          now={now}
          plan={plan}
          onLapRemoved={onLapRemoved}
        />
      ) : (
        <View>
          {logged.map((s, i) => (
            <LapRow key={i} n={i + 1} value={lapAmount(plan, s.reps ?? s.onS ?? 0)} />
          ))}
          {Array.from({ length: Math.max(0, planned - logged.length) }, (_, i) => (
            <Waiting key={`w${i}`} n={logged.length + i + 1} />
          ))}
        </View>
      )}
    </ExerciseBlock>
  );
}
