import React from "react";
import { clock, type SessionItem } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { exerciseName, exerciseTargetLine } from "@sendtally/features/workouts";
import { Icon } from "../../components/Icon";
import { MoreMenu, type MoreMenuItem } from "../../components/MoreMenu";
import { LetterBadge } from "../components/LetterBadge";
import { AboutButton, type About } from "./AboutButton";

export type ExerciseCardHeadProps = {
  item: SessionItem;
  /** The exercise's description behind an info button beside its name; none without one. */
  about?: About | undefined;
  /** Its title folds it. */
  onFold: () => void;
  /** Its ··· menu: skip, move, remove. */
  menu: readonly MoreMenuItem[];
};

/** An open exercise card's head: its name to fold it, its letter, rest, menu and target effort. */
export function ExerciseCardHead({
  item,
  about,
  onFold,
  menu,
}: ExerciseCardHeadProps): React.ReactElement {
  const name = exerciseName(item.exercise);
  const { name: doseName, setRestS = 0, targetRpe } = item.dose;
  return (
    <>
      <div className="player-card-head">
        <span className="player-card-title">
          <button
            type="button"
            className="player-card-fold"
            aria-label={t("workouts.foldExercise", { name })}
            aria-expanded="true"
            onClick={onFold}
          >
            <h2 className="player-card-name">{name}</h2>
            <span className="player-chevron player-chevron--up">
              <Icon name="chevron" size={16} strokeWidth={2} />
            </span>
          </button>
          <AboutButton about={about} label={t("workouts.aboutExercise")} />
        </span>
        {item.turn !== undefined && (
          <span className="player-card-turn">
            <LetterBadge dose={item.turn} />
            {doseName !== undefined && <span className="player-card-meta">{doseName}</span>}
          </span>
        )}
        {setRestS > 0 && (
          <span className="player-card-meta">{t("plan.chipRest", { value: clock(setRestS) })}</span>
        )}
        <MoreMenu label={t("workouts.exerciseMore")} items={menu} />
      </div>
      {targetRpe !== undefined && (
        <span className="player-card-meta player-card-aim">{exerciseTargetLine(item.dose)}</span>
      )}
    </>
  );
}
