import React from "react";
import type { ItemDone, SessionItem, SetDone, WeightUnit } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import {
  exerciseName,
  memberSetLabel,
  nextInRound,
  restPreviewAfter,
  roundOn,
  setKey,
  supersetNextLine,
  supersetRoundTitle,
  type RunGroup,
  type SetAt,
} from "@sendtally/features/workouts";
import { Icon } from "../../components/Icon";
import { MoreMenu, type MoreMenuItem } from "../../components/MoreMenu";
import { RestPreview } from "./RestPreview";
import { SetRow } from "./SetRow";

export type SupersetCardProps = {
  group: RunGroup;
  /** The run's items, sets as many as each has now. */
  items: readonly SessionItem[];
  done: readonly ItemDone[];
  target: (at: SetAt) => SetDone;
  lifting: (item: number) => boolean;
  ticked: ReadonlySet<string>;
  current: SetAt | null;
  unit: WeightUnit;
  onChange: (at: SetAt, value: SetDone) => void;
  onToggle: (at: SetAt) => void;
  holdRow: (at: SetAt) => React.ReactNode;
  go: (at: SetAt) => React.ReactNode;
  restUnder: (at: SetAt) => React.ReactNode;
  onFocus: (at: SetAt) => void;
  onRemoveSet: (at: SetAt) => void;
  /** One more round, for every member. */
  onAddRound: () => void;
  onFold: () => void;
  menu: readonly MoreMenuItem[];
};

/**
 * A superset as one card, round by round: A1, B1, C1, then A2. Every set is live in any order; a
 * rest between members shows only when the superset has one, and the rest after a round between.
 */
export function SupersetCard({
  group,
  items,
  done,
  target,
  lifting,
  ticked,
  current,
  unit,
  onChange,
  onToggle,
  holdRow,
  go,
  restUnder,
  onFocus,
  onRemoveSet,
  onAddRound,
  onFold,
  menu,
}: SupersetCardProps): React.ReactElement {
  const setsOf = (m: number): number => done.find((d) => d.item === m)?.sets.length ?? 0;
  const rounds = Math.max(...group.members.map(setsOf));
  const title = supersetRoundTitle(roundOn(items, ticked, group), rounds);
  const nameOf = (m: number): string => exerciseName(items[m]?.exercise ?? "");
  const next = supersetNextLine(
    nextInRound(items, ticked, group)
      .filter((m) => m !== current?.item)
      .map(nameOf)
  );
  return (
    <section className="player-card">
      <div className="player-card-head">
        <span className="player-card-title">
          <button
            type="button"
            className="player-card-fold"
            aria-label={t("workouts.foldExercise", { name: title })}
            aria-expanded="true"
            onClick={onFold}
          >
            <h2 className="player-card-name">{title}</h2>
            <span className="player-chevron player-chevron--up">
              <Icon name="chevron" size={16} strokeWidth={2} />
            </span>
          </button>
        </span>
        <MoreMenu label={t("workouts.exerciseMore")} items={menu} />
      </div>
      {next !== null && <span className="player-card-meta player-card-aim">{next}</span>}
      {Array.from({ length: rounds }, (_, set) => (
        <React.Fragment key={set}>
          <span
            className={`train-label train-label--small superset-round${set === 0 ? " superset-round--first" : ""}`}
          >
            {t("workouts.roundN", { n: set + 1 })}
          </span>
          {group.members.map((item, letter) => {
            const at = { item, set };
            const value = done.find((d) => d.item === item)?.sets[set];
            if (value === undefined) return null;
            const name = nameOf(item);
            const rest = restPreviewAfter(group, (m) => setsOf(m), letter, set);
            return (
              <React.Fragment key={item}>
                {holdRow(at) || (
                  <SetRow
                    n={set + 1}
                    tag={memberSetLabel(letter, set)}
                    name={name}
                    repsMax={items[item]?.dose.repsMax}
                    target={target(at)}
                    done={value}
                    previous={undefined}
                    lifting={lifting(item)}
                    ticked={ticked.has(setKey(at))}
                    current={current?.item === item && current.set === set}
                    unit={unit}
                    label={t("activities.setOf", { exercise: name, n: set + 1 })}
                    onChange={(v) => onChange(at, v)}
                    onToggle={() => onToggle(at)}
                    onFocus={() => onFocus(at)}
                    onRemove={() => onRemoveSet(at)}
                    go={go(at) || undefined}
                  />
                )}
                {restUnder(at) || (rest !== null && <RestPreview seconds={rest} />)}
              </React.Fragment>
            );
          })}
        </React.Fragment>
      ))}
      <button type="button" className="outline-button player-add-set" onClick={onAddRound}>
        + {t("workouts.addRound")}
      </button>
    </section>
  );
}
