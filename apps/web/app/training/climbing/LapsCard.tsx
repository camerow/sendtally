import React from "react";
import type { SessionItem, WeightUnit } from "@sendtally/core/hang";
import { lapPlanOf } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import {
  useLapsTally,
  type LiveSession,
  type LogSessionDraft,
} from "@sendtally/features/log-session";
import { exerciseName, targetText, type RestClock } from "@sendtally/features/workouts";
import type { MoreMenuItem } from "../../components/MoreMenu";
import type { About } from "../components/AboutButton";
import { ExerciseBlock } from "../components/ExerciseBlock";
import { ExerciseHead } from "../components/ExerciseHead";
import { SetRow, type SetRowProps } from "../components/SetRow";
import { useSessionTarget } from "../components/sessionTarget";
import { LapValue } from "./LapValue";
import { IdleRestRow } from "../players/IdleRestRow";
import { RestRow } from "../players/RestRow";

export type LapsCardProps = {
  item: number;
  at: SessionItem;
  /** The laps it asks for now, after any Add lap or −. */
  planned: number;
  draft: LogSessionDraft | null;
  /** The draft with the tally on this card, for a change made on it; it moves no focus. */
  on: () => LogSessionDraft;
  live: LiveSession;
  rest: RestClock;
  now: Date;
  unit: WeightUnit;
  about?: About | undefined;
  /** Where its history opens. */
  history?: string | undefined;
  onFold: () => void;
  menu: readonly MoreMenuItem[];
  /** A lap was taken out, for its Undo. */
  onLapRemoved: (lap: number) => void;
};

type Removable = Partial<Pick<SetRowProps, "selected" | "onSelect" | "onRemove">>;

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
  history,
  onFold,
  menu,
  onLapRemoved,
}: LapsCardProps): React.ReactElement {
  const sessionRpe = useSessionTarget();
  const plan = lapPlanOf(at.dose);
  const laps = useLapsTally(draft, item, plan, planned, on, live, rest, now);
  const [moves, setMoves] = React.useState<{ lap: number; n: number } | null>(null);
  const [selected, setSelected] = React.useState<number | null>(null);
  const done = laps.laps.length;
  const nextMoves = moves?.lap === done ? moves.n : plan.target;
  const label = (n: number): string => t("tally.lapLabel", { lap: n });
  const select =
    (n: number): (() => void) =>
    () =>
      setSelected(selected === n ? null : n);
  const removeLap = laps.removeLap;
  const removable = (n: number): Removable =>
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
  return (
    <ExerciseBlock
      head={
        <ExerciseHead
          name={exerciseName(at.exercise)}
          target={targetText(at.dose, "laps", unit, { sessionRpe })}
          about={about}
          {...(history !== undefined && { history })}
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
          <LapValue
            label={label(i + 1)}
            value={value}
            plan={plan}
            onChange={(n) => laps.change(i, n)}
          />
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
          <IdleRestRow seconds={laps.rest.seconds} onStart={laps.startRest} />
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
          <LapValue
            label={label(done + 1)}
            value={plan.unit === "seconds" ? (laps.elapsed ?? 0) : nextMoves}
            plan={plan}
            onChange={(n) => setMoves({ lap: done, n })}
            {...(laps.elapsed === null && { onStart: laps.startLap })}
          />
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
