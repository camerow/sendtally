import React from "react";
import { Link } from "react-router";
import type { WorkoutKind } from "@sendtally/core/hang";
import { kindLabel } from "@sendtally/features/activities";
import {
  measureLabel,
  pickerEntries,
  usePickerWorld,
  type PickerEntry,
} from "@sendtally/features/exercises";
import { gripMeta } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";
import { DetailFrame } from "../../components/detail/DetailFrame";
import { newExercisePath } from "../editor/paths";
import { useAppApi } from "../../lib/useAppApi";
import { CategoryMark } from "../components/CategoryMark";
import { DashedPanel } from "../components/DashedPanel";
import { useHangData, type HangData } from "../data/HangDataContext";
import { EXERCISES_VIEW, exercisePath, gripPath } from "./paths";

const mine = ({ source }: PickerEntry): boolean =>
  "exercise" in source || ("grip" in source && source.grip.custom);

const pathOf = ({ source }: PickerEntry): string | undefined =>
  "exercise" in source
    ? exercisePath(source.exercise.id)
    : "grip" in source
      ? gripPath(source.grip.id)
      : undefined;

function metaOf(entry: PickerEntry, { model, today }: HangData): string {
  if ("grip" in entry.source)
    return gripMeta(model.sessions, entry.source.grip.id, today, model.settings.units, true);
  if (entry.uses > 0) return t("workouts.timesUsed", { count: entry.uses });
  if (entry.library) return t("workouts.fromLibrary");
  if (!("exercise" in entry.source)) return "";
  const { measure, kind } = entry.source.exercise;
  return measureLabel(measure, kind);
}

function EntryRow({ entry }: { entry: PickerEntry }): React.ReactElement {
  const meta = metaOf(entry, useHangData());
  const to = pathOf(entry);
  const body = (
    <>
      <span className="entry-row-name">
        {entry.name}
        {mine(entry) && <span className="mine-badge">{t("workouts.mine")}</span>}
      </span>
      {meta !== "" && <span className="entry-row-meta">{meta}</span>}
    </>
  );
  return to === undefined ? (
    <div className="entry-row">{body}</div>
  ) : (
    <Link to={to} className="entry-row entry-row--link">
      {body}
    </Link>
  );
}

/** All of one category's exercises, the user's own badged among the starter ones, the most used first, to search. */
export function ExerciseCategoryPage({ kind }: { kind: WorkoutKind }): React.ReactElement {
  const { model } = useHangData();
  const world = usePickerWorld(useAppApi(), model, [], kind === "hangboard");
  const [text, setText] = React.useState("");
  const label = kindLabel(kind);
  const placeholder = t("focus.search", { focus: label });
  const entries = pickerEntries(world, { category: kind, text });
  return (
    <DetailFrame
      backTo={EXERCISES_VIEW}
      action={
        <Link
          to={newExercisePath(kind)}
          className="detail-add"
          aria-label={t("workouts.newExerciseIn", { category: label })}
        >
          <Icon name="plus" size={18} strokeWidth={2.5} />
        </Link>
      }
    >
      <div className="intro">
        <span className="intro-kicker">
          <CategoryMark kind={kind} />
          <h1 className="train-title intro-title">{label}</h1>
        </span>
        <p className="intro-body">{t(`workouts.categoryEmpty.${kind}`)}</p>
      </div>
      <div className="library-browser">
        <input
          type="search"
          className="library-search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          autoComplete="off"
          maxLength={80}
        />
        {entries.length === 0 ? (
          <DashedPanel
            title={t("workouts.noResultsTitle")}
            body={t("workouts.noExerciseCalled", { name: text.trim() })}
          />
        ) : (
          <div>
            {entries.map((entry) => (
              <EntryRow key={entry.key} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </DetailFrame>
  );
}
