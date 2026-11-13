import React from "react";
import { WORKOUT_KINDS, type Item, type WorkoutKind } from "@sendtally/core/hang";
import { kindLabel } from "@sendtally/features/activities";
import {
  entryNamed,
  measureLabel,
  pickedOf,
  pickerEntries,
  usePickerWorld,
  type ExerciseForm,
  type PickerEntry,
} from "@sendtally/features/exercises";
import { gripMeta } from "@sendtally/features/hang";
import { t } from "@sendtally/features/i18n";
import { KIND_COLORS } from "@sendtally/features/training";
import type { Picked } from "@sendtally/features/workouts";
import { chipStyle } from "../../components/chip";
import { Sheet } from "../../components/Sheet";
import { useAppApi } from "../../lib/useAppApi";
import { useHangData } from "../data/HangDataContext";
import { CategorySheet } from "./CategorySheet";
import { NewExerciseSheet } from "./NewExerciseSheet";
import { useMake, usePick } from "./useMake";

export type ExercisePickerProps = {
  /** The workout's kind: the category the picker starts on. */
  kind: WorkoutKind;
  /** The workout's items, tagged in the list. */
  items: readonly Item[];
  /** Tick several and add them; otherwise a press picks one, to swap. */
  multi: boolean;
  onPick: (picked: Picked[]) => void;
  onClose: () => void;
};

type Category = WorkoutKind | "all";

const NOT_FINGERS = WORKOUT_KINDS.filter((k) => k !== "hangboard");

/**
 * The exercise library, to build a workout from: search, a category or all, the most used
 * first. Ticked exercises are added in the order they were ticked; New makes one in the
 * category in view, asking which one under All, and adds it once saved.
 */
export function ExercisePicker({
  kind,
  items,
  multi,
  onPick,
  onClose,
}: ExercisePickerProps): React.ReactElement {
  const { model, today } = useHangData();
  const pick = usePick();
  const make = useMake();
  const fingers = kind === "hangboard";
  const [text, setText] = React.useState("");
  const [category, setCategory] = React.useState<Category>(kind);
  const [ticked, setTicked] = React.useState<PickerEntry[]>([]);
  const [making, setMaking] = React.useState<WorkoutKind | "choose" | null>(null);
  const world = usePickerWorld(
    useAppApi(),
    model,
    items.map((i) => i.exercise),
    fingers
  );
  const entries = pickerEntries(world, { category, text });
  const typed = text.trim();

  const finish = async (): Promise<void> => {
    onClose();
    const picked = await Promise.all(ticked.map((e) => pick(e.source)));
    onPick(picked.filter((p) => p !== null));
  };
  const press = (entry: PickerEntry): void => {
    if (!multi) {
      onClose();
      void pick(entry.source).then((p) => p !== null && onPick([p]));
      return;
    }
    setTicked((list) =>
      list.some((e) => e.key === entry.key)
        ? list.filter((e) => e.key !== entry.key)
        : [...list, entry]
    );
  };
  const added = async (form: ExerciseForm): Promise<void> => {
    const existing = entryNamed(world, form.name);
    if (existing !== undefined && ticked.some((e) => e.key === existing.key)) return;
    const one =
      existing === undefined
        ? await make(form).then((m) => (m === null ? null : pickedOf(m)))
        : await pick(existing.source);
    if (one !== null) onPick([one]);
  };
  const metaOf = (entry: PickerEntry): string => {
    if ("grip" in entry.source)
      return gripMeta(model.sessions, entry.source.grip.id, today, model.settings.units, true);
    if (entry.uses > 0) return t("workouts.timesUsed", { count: entry.uses });
    if (entry.library) return t("workouts.fromLibrary");
    if (!("exercise" in entry.source)) return "";
    return measureLabel(entry.source.exercise.measure, entry.source.exercise.kind);
  };
  const newButton = (
    <button
      type="button"
      className="outline-button"
      onClick={() => setMaking(category === "all" ? "choose" : category)}
    >
      + {t("workouts.newShort")}
    </button>
  );

  if (making === "choose")
    return (
      <CategorySheet
        making="exercise"
        kinds={NOT_FINGERS}
        onPick={setMaking}
        onClose={() => setMaking((m) => (m === "choose" ? null : m))}
      />
    );
  if (making !== null)
    return (
      <NewExerciseSheet
        kind={making}
        name={typed}
        onSave={(form) => {
          if (multi) void finish();
          else onClose();
          void added(form);
        }}
        onClose={() => setMaking(null)}
      />
    );

  return (
    <Sheet
      open
      title={multi ? t("workouts.addExercises") : t("workouts.swapExercise")}
      onClose={onClose}
      {...(multi &&
        ticked.length > 0 && {
          action: {
            label: t("workouts.addCount", { count: ticked.length }),
            onPress: () => void finish(),
          },
        })}
    >
      <div className="picker">
        <div className="picker-top">
          <input
            type="search"
            className="library-search"
            value={text}
            maxLength={80}
            placeholder={t("workouts.searchExercises")}
            aria-label={t("workouts.searchExercises")}
            onChange={(e) => setText(e.target.value)}
          />
          {newButton}
        </div>
        {!fingers && (
          <div className="setup-chips">
            {[...NOT_FINGERS, "all" as const].map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={category === k}
                style={chipStyle(category === k, { minHeight: 40 })}
                onClick={() => setCategory(k)}
              >
                {k !== "all" && (
                  <span className="chip-mark" style={{ background: KIND_COLORS[k] }} />
                )}
                {k === "all" ? t("workouts.allCategories") : kindLabel(k)}
              </button>
            ))}
          </div>
        )}
        {entries.length === 0 ? (
          typed !== "" && (
            <p className="form-hint">{t("workouts.noExerciseCalled", { name: typed })}</p>
          )
        ) : (
          <div className="picker-list">
            <span className="train-label">{t("workouts.mostUsed")}</span>
            {entries.map((entry) => {
              const on = ticked.some((e) => e.key === entry.key);
              const meta = metaOf(entry);
              return (
                <button
                  key={entry.key}
                  type="button"
                  className="picker-row"
                  role={multi ? "checkbox" : undefined}
                  aria-checked={multi ? on : undefined}
                  onClick={() => press(entry)}
                >
                  {multi && <span className={on ? "picker-tick picker-tick--on" : "picker-tick"} />}
                  <span className="picker-row-text">
                    <span className="picker-row-name">{entry.name}</span>
                    {meta !== "" && <span className="picker-row-meta">{meta}</span>}
                  </span>
                  {entry.inWorkout && (
                    <span className="train-label">{t("workouts.inWorkout")}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Sheet>
  );
}
