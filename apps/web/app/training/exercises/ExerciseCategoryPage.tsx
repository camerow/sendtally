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
import { Lock } from "../../components/Lock";
import { DetailFrame } from "../../components/detail/DetailFrame";
import { newExercisePath } from "../editor/paths";
import { useAppApi } from "../../lib/useAppApi";
import { CategoryMark } from "../components/CategoryMark";
import { DashedPanel } from "../components/DashedPanel";
import { useHangData, type HangData } from "../data/HangDataContext";
import { joinPath, useLocks } from "../locks";
import { useLockedExercises, type RowLink } from "../useLockedRows";
import { EXERCISES_VIEW, sourcePath } from "./paths";

const mine = ({ source }: PickerEntry): boolean =>
  "exercise" in source || ("grip" in source && source.grip.custom);

function metaOf(entry: PickerEntry, { model, today }: HangData): string {
  if ("grip" in entry.source)
    return gripMeta(model.sessions, entry.source.grip.id, today, model.settings.units, true);
  if (entry.library) return t("workouts.fromLibrary");
  if (!("exercise" in entry.source)) return "";
  const { measure, kind } = entry.source.exercise;
  return measureLabel(measure, kind);
}

function EntryRow({
  entry,
  to,
  locked = false,
  menu,
}: { entry: PickerEntry } & RowLink): React.ReactElement {
  const meta = metaOf(entry, useHangData());
  const body = (
    <>
      <span className="entry-row-name">
        {entry.name}
        {mine(entry) && <span className="mine-badge">{t("workouts.mine")}</span>}
      </span>
      {meta !== "" && <span className="entry-row-meta">{meta}</span>}
      {locked && <Lock />}
    </>
  );
  const row = (
    <Link
      to={to}
      className={
        locked ? "entry-row entry-row--link entry-row--locked" : "entry-row entry-row--link"
      }
      aria-label={locked ? t("common.membersOnly", { label: entry.name }) : undefined}
    >
      {body}
    </Link>
  );
  return menu === undefined ? (
    row
  ) : (
    <div className="locked-row">
      {row}
      {menu}
    </div>
  );
}

/** All of one category's exercises, the user's own badged among the starter ones, the most used first, to search. */
export function ExerciseCategoryPage({ kind }: { kind: WorkoutKind }): React.ReactElement {
  const { model } = useHangData();
  const world = usePickerWorld(
    useAppApi(),
    model,
    [],
    kind === "hangboard" ? "grips" : "exercises"
  );
  const [text, setText] = React.useState("");
  const label = kindLabel(kind);
  const placeholder = t("focus.search", { focus: label });
  const entries = pickerEntries(world, { category: kind, text });
  const locked = useLockedExercises();
  const create = useLocks().create;
  const newLabel = t("workouts.newExerciseIn", { category: label });
  return (
    <DetailFrame
      backTo={EXERCISES_VIEW}
      action={
        <Link
          to={create ? joinPath("create") : newExercisePath(kind)}
          className={create ? "detail-add detail-add--locked" : "detail-add"}
          aria-label={create ? t("common.membersOnly", { label: newLabel }) : newLabel}
        >
          {create ? <Lock /> : <Icon name="plus" size={18} strokeWidth={2.5} />}
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
              <EntryRow
                key={entry.key}
                entry={entry}
                {...locked.row(entry, sourcePath(entry.source))}
              />
            ))}
          </div>
        )}
      </div>
      {locked.sheet}
    </DetailFrame>
  );
}
