import React from "react";
import { t } from "@sendtally/features/i18n";
import type { TargetText } from "@sendtally/features/workouts";
import { Icon } from "../../components/Icon";
import { MoreMenu, type MoreMenuItem } from "../../components/MoreMenu";
import { AboutButton, type About } from "./AboutButton";
import { HistoryButton } from "./HistoryButton";

export type ExerciseHeadProps = {
  name: string;
  /** This session's target, said once: its work, then its Target RPE on a line of its own. */
  target?: TargetText;
  /** Where its history opens; no button without one. */
  history?: string;
  /** In the run: its name folds it. */
  onFold?: () => void;
  /** The exercise's description behind an info button beside its name. */
  about?: About | undefined;
  /** In the run: its ··· menu, skip, move, remove. */
  menu?: readonly MoreMenuItem[];
};

/** An exercise block's head: the strongest text is its name, then the target it aims for. */
export function ExerciseHead({
  name,
  target,
  history,
  onFold,
  about,
  menu,
}: ExerciseHeadProps): React.ReactElement {
  const lines = [target?.work, target?.rpe].filter((l): l is string => l !== undefined && l !== "");
  return (
    <div className="exercise-head">
      <div className="exercise-head-top">
        <span className="exercise-head-title">
          {onFold === undefined ? (
            <h2 className="exercise-head-name">{name}</h2>
          ) : (
            <button
              type="button"
              className="exercise-head-fold"
              aria-label={t("workouts.foldExercise", { name })}
              aria-expanded="true"
              onClick={onFold}
            >
              <h2 className="exercise-head-name">{name}</h2>
              <span className="player-chevron player-chevron--up">
                <Icon name="chevron" size={16} strokeWidth={2} />
              </span>
            </button>
          )}
          <AboutButton about={about} label={t("workouts.aboutExercise")} />
        </span>
        {history !== undefined && <HistoryButton name={name} to={history} />}
        {menu !== undefined && <MoreMenu label={t("workouts.exerciseMore")} items={menu} />}
      </div>
      {lines.map((line) => (
        <span key={line} className="exercise-head-target">
          {line}
        </span>
      ))}
    </div>
  );
}
