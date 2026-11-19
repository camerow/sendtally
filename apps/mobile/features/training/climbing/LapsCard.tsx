import React from "react";
import { Pressable, Text, View } from "react-native";
import { clock, type SessionItem, type SetDone } from "@sendtally/core/hang";
import { colors, radius } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import {
  enduranceAmountLabel,
  lapRowsOf,
  useLapsTally,
  type LiveSession,
  type LogSessionDraft,
} from "@sendtally/features/log-session";
import { lapPlanOf } from "@sendtally/features/activities";
import type { RestClock } from "@sendtally/features/workouts";
import { Icon } from "../../../components/Icon";
import { press } from "../../../lib/press";
import type { About } from "../components/AboutButton";
import { Button } from "../components/Button";
import { Label } from "../components/Label";
import { AMBER } from "../components/tints";
import type { DetailMenuRow } from "../components/types";
import { RestRow } from "../rest/RestRow";
import { ExerciseHead } from "../sets/ExerciseHead";
import { exerciseName, exerciseTargetLine } from "@sendtally/features/workouts";
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
  about?: About | undefined;
  onFold: () => void;
  menu: readonly DetailMenuRow[];
  /** A lap still to climb was taken out, for its Undo. */
  onLapRemoved: (lap: number) => void;
};

type Shown = { n: number; share: number; clean: boolean; value: string };

function LapRow({ n, share, clean, value }: Shown): React.ReactElement {
  return (
    <View
      accessibilityLabel={`${t("tally.lapLabel", { lap: n })}, ${value}`}
      style={{
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 4,
      }}
    >
      <Text style={[type.monoBold, { width: 30, fontSize: 14, color: colors.gunmetal }]}>{n}</Text>
      <View
        style={{
          flex: 1,
          height: 10,
          borderRadius: 5,
          overflow: "hidden",
          backgroundColor: colors.dataBarEmpty,
        }}
      >
        <View
          style={{
            width: `${Math.round(share * 100)}%`,
            height: 10,
            borderRadius: 5,
            backgroundColor: clean ? colors.fern : AMBER,
          }}
        />
      </View>
      <Text
        style={[
          type.monoBold,
          { minWidth: 48, textAlign: "right", fontSize: 13, color: colors.gunmetal },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function RemoveLap({ n, onRemove }: { n: number; onRemove: () => void }): React.ReactElement {
  return (
    <Pressable
      onPress={onRemove}
      accessibilityRole="button"
      accessibilityLabel={t("tally.removeLapOf", { lap: n })}
      style={press({ width: 32, height: 40, alignItems: "center", justifyContent: "center" })}
    >
      <Icon name="minusCircle" color={colors.watermelonInk} size={24} strokeWidth={1.5} />
    </Pressable>
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

function Waiting({
  n,
  text,
  onRemove,
}: {
  n: number;
  text: string;
  onRemove: (() => void) | null;
}): React.ReactElement {
  return (
    <View
      style={{
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 4,
      }}
    >
      <Text style={[type.monoBold, { width: 30, fontSize: 14, color: colors.textMuted }]}>{n}</Text>
      <Text style={[type.mono, { flex: 1, fontSize: 13, color: colors.textSecondary }]}>
        {text}
      </Text>
      {onRemove !== null && <RemoveLap n={n} onRemove={onRemove} />}
    </View>
  );
}

/** The lap on the wall: Attempt or Sent, and an Attempt asks in the row how far it got. */
function LiveLaps({
  draft,
  live,
  rest,
  now,
  target,
  lapText,
  onLapRemoved,
}: {
  draft: LogSessionDraft;
  live: LiveSession;
  rest: RestClock;
  now: Date;
  target: number;
  /** "40 moves", for a lap still to come. */
  lapText: string;
  onLapRemoved: (lap: number) => void;
}): React.ReactElement | null {
  const laps = useLapsTally(draft, live, rest, now);
  const [stepAt, setStepAt] = React.useState<{ lap: number; n: number } | null>(null);
  if (laps === null) return null;
  const done = laps.rows.length;
  const step = stepAt?.lap === done ? stepAt.n : null;
  const setStep = (n: number | null): void => setStepAt(n === null ? null : { lap: done, n });
  const removeLap = laps.removeLap;
  const remove =
    removeLap === null
      ? null
      : (n: number) => () => {
          removeLap();
          onLapRemoved(n);
        };
  const waiting = Array.from(
    { length: Math.max(0, laps.planned - done - 1) },
    (_, i) => done + i + 2
  );
  return (
    <>
      {laps.rows.map((row, i) => (
        <LapRow key={i} n={i + 1} share={row.share} clean={row.clean} value={row.value} />
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
      {laps.next !== null && (
        <View
          style={{
            minHeight: 48,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 4,
            borderRadius: 10,
            backgroundColor: colors.surfaceSoft,
          }}
        >
          <Text style={[type.monoBold, { width: 30, fontSize: 14, color: colors.gunmetal }]}>
            {done + 1}
          </Text>
          {step !== null ? (
            <>
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
                  {`${step}/${target}`}
                </Text>
                <Pressable
                  onPress={() => setStep(Math.min(target - 1, step + 1))}
                  accessibilityRole="button"
                  accessibilityLabel={t("tally.moreMoves")}
                  hitSlop={4}
                  style={press(STEP)}
                >
                  <Text style={[type.bodyBold, { fontSize: 20, color: colors.gunmetal }]}>+</Text>
                </Pressable>
              </View>
              <Button
                label={t("common.save")}
                onPress={() => {
                  laps.attemptAt(step);
                  setStep(null);
                }}
                variant="primary"
                height={44}
              />
            </>
          ) : laps.next.startable ? (
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Button
                label={t("tally.startLap")}
                onPress={laps.startLap}
                variant="outline"
                height={44}
              />
            </View>
          ) : (
            <>
              <Text style={[type.mono, { flex: 1, fontSize: 13, color: colors.textSecondary }]}>
                {laps.next.text}
              </Text>
              {remove !== null && <RemoveLap n={done + 1} onRemove={remove(done + 1)} />}
            </>
          )}
        </View>
      )}
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
        <Waiting key={n} n={n} text={lapText} onRemove={remove === null ? null : remove(n)} />
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

/** A circuit exercise as a row per lap: how far each got, the lap on the wall, and + Add lap. */
export function LapsCard({
  item,
  at,
  logged,
  planned,
  draft,
  live,
  rest,
  now,
  about,
  onFold,
  menu,
  onLapRemoved,
}: LapsCardProps): React.ReactElement {
  const plan = lapPlanOf(at.dose);
  const active = draft?.exercise?.item === item;
  const lapText = enduranceAmountLabel({ ...plan, laps: [] }, plan.target);
  return (
    <View
      style={{
        gap: 4,
        padding: 14,
        paddingTop: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
      }}
    >
      <ExerciseHead
        name={exerciseName(at.exercise)}
        target={{ work: "", rpe: exerciseTargetLine(at.dose) }}
        about={about}
        onFold={onFold}
        menu={menu}
      />
      <View style={{ flexDirection: "row", gap: 8, paddingVertical: 4 }}>
        <Label small color={colors.textSecondary} style={{ width: 34 }}>
          {t("workouts.colLap")}
        </Label>
        <Label small color={colors.textSecondary}>
          {plan.unit === "moves"
            ? t("workouts.movesPerLap", { n: plan.target })
            : t("workouts.timePerLap", { time: clock(plan.target) })}
        </Label>
      </View>
      {active && draft !== null ? (
        <LiveLaps
          draft={draft}
          live={live}
          rest={rest}
          now={now}
          target={plan.target}
          lapText={lapText}
          onLapRemoved={onLapRemoved}
        />
      ) : (
        <View>
          {lapRowsOf(logged, plan).map((row, i) => (
            <LapRow key={i} n={i + 1} {...row} />
          ))}
          {Array.from({ length: Math.max(0, planned - logged.length) }, (_, i) => (
            <Waiting key={`w${i}`} n={logged.length + i + 1} text={lapText} onRemove={null} />
          ))}
        </View>
      )}
    </View>
  );
}
