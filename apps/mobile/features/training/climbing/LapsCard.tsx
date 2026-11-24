import React from "react";
import type { SessionItem, WeightUnit } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import {
  useLapsTally,
  type LiveSession,
  type LogSessionDraft,
} from "@sendtally/features/log-session";
import { lapPlanOf } from "@sendtally/features/activities";
import { exerciseName, targetText, type RestClock } from "@sendtally/features/workouts";
import type { About } from "../components/AboutButton";
import type { DetailMenuRow } from "../components/types";
import { RestRow } from "../rest/RestRow";
import { ExerciseBlock } from "../sets/ExerciseBlock";
import { ExerciseHead } from "../sets/ExerciseHead";
import { SetRow, type SetRowProps } from "../sets/SetRow";
import { useSessionTarget } from "../sets/sessionTarget";
import { LapValue } from "./LapValue";

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
  onHistory?: (() => void) | undefined;
  onFold: () => void;
  menu: readonly DetailMenuRow[];
  /** A lap was taken out, for its Undo. */
  onLapRemoved: (lap: number) => void;
};

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
  const laps = useLapsTally(draft, item, plan, planned, on, live, rest, now);
  /** Moves set on the laps not logged yet, from the lap on the wall; the target where none is. */
  const [open, setOpen] = React.useState<readonly (number | undefined)[]>([]);
  const [selected, setSelected] = React.useState<number | null>(null);
  const done = laps.laps.length;
  const toGo = Math.max(0, planned - done);
  const movesAt = (k: number): number => open[k] ?? plan.target;
  const upTo = (k: number): number[] => Array.from({ length: k }, (_, i) => movesAt(i));
  const without = (k: number): (number | undefined)[] =>
    Array.from({ length: toGo }, (_, i) => open[i]).filter((_, i) => i !== k);
  const select =
    (n: number): (() => void) =>
    () =>
      setSelected(selected === n ? null : n);
  const label = (n: number): string => t("tally.lapLabel", { lap: n });
  const removeLap = laps.removeLap;
  const removable = (
    k: number
  ): Partial<Pick<SetRowProps, "selected" | "onSelect" | "onRemove">> =>
    removeLap === null
      ? {}
      : {
          selected: selected === done + k + 1,
          onSelect: select(done + k + 1),
          onRemove: () => {
            removeLap();
            setOpen(without(k));
            setSelected(null);
            onLapRemoved(done + k + 1);
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
          <RestRow rest={null} seconds={laps.rest.seconds} onStart={laps.startRest} />
        ))}
      {Array.from({ length: toGo }, (_, k) => (
        <SetRow
          key={`open${done + k}`}
          position={String(done + k + 1)}
          label={label(done + k + 1)}
          ticked={false}
          onToggle={() => {
            laps.tick(upTo(k + 1));
            setOpen(open.slice(k + 1));
          }}
          removeLabel={t("tally.removeLapOf", { lap: done + k + 1 })}
          {...removable(k)}
        >
          <LapValue
            label={label(done + k + 1)}
            value={plan.unit === "seconds" ? (k === 0 ? (laps.elapsed ?? 0) : 0) : movesAt(k)}
            plan={plan}
            onChange={(n) =>
              setOpen(Array.from({ length: toGo }, (_, i) => (i === k ? n : open[i])))
            }
            clock={{
              running: k === 0 && laps.running,
              onToggle: () => {
                laps.toggleLap(upTo(k));
                setOpen(open.slice(k));
              },
            }}
          />
        </SetRow>
      ))}
    </ExerciseBlock>
  );
}
