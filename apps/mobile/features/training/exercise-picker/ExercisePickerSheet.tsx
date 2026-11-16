import React from "react";
import { Text, View } from "react-native";
import type { Item, WorkoutKind } from "@sendtally/core/hang";
import { colors, sheetTitleSize } from "@sendtally/design/tokens";
import { kindLabel } from "@sendtally/features/activities";
import {
  entryNamed,
  pickerEntries,
  pickerState,
  type PickerEntry,
} from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import { TextInput } from "../../../components/TextInput";
import { Button } from "../components/Button";
import { ChipRow } from "../components/ChipRow";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { HangSheet } from "../data/HangSheet";
import { openExerciseEditor, openGripEditor } from "../exercises/openExerciseEditor";
import type { ExerciseForm } from "../exercises/types";
import { useMakeExercise } from "../exercises/useMakeExercise";
import { KIND_COLORS } from "@sendtally/features/training";
import { ExerciseCategorySheet } from "../exercises/ExerciseCategorySheet";
import { type } from "../type";
import { PickerRow } from "./PickerRow";
import type { Picked } from "@sendtally/features/workouts";
import { pickedOf, usePick } from "./usePick";
import { usePickerWorld } from "./usePickerWorld";

export type ExercisePickerSheetProps = {
  /** The workout's items, tagged in the list; grips in it offer grips only, anything else no grips. */
  items: readonly Item[];
  /** Tick several and add them; otherwise a tap picks one, to swap. */
  multi: boolean;
  onPick: (picked: Picked[]) => void;
  onClose: () => void;
};

type Category = WorkoutKind | "all";

/**
 * The exercise library, to build a workout from: search, a category or all, the most used
 * first. Ticked exercises are added in the order they were ticked; New adds them, then opens
 * the exercise editor on what was typed in the category in view, asking which one under All,
 * and adds the exercise once saved. It starts on All; once a grip is in the workout or ticked
 * it offers only grips, and once anything else is, no grips. A grip's pencil opens it in the
 * exercise editor.
 */
export function ExercisePickerSheet({
  items,
  multi,
  onPick,
  onClose,
}: ExercisePickerSheetProps): React.ReactElement {
  const pick = usePick();
  const make = useMakeExercise();
  const [text, setText] = React.useState("");
  const [category, setCategory] = React.useState<Category>("all");
  const [ticked, setTicked] = React.useState<PickerEntry[]>([]);
  const [choosing, setChoosing] = React.useState(false);
  const world = usePickerWorld(
    items.map((i) => i.exercise),
    "all"
  );
  const { offer, kinds, newKind } = pickerState(
    world,
    items.map((i) => i.exercise),
    ticked,
    category
  );
  const entries = pickerEntries({ ...world, offer }, { category, text });
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
  const leave = (): void => (multi ? void finish() : onClose());
  const startNew = (made: WorkoutKind): void => {
    const added = ticked.map((e) => e.key);
    const add = async (form: ExerciseForm): Promise<void> => {
      const existing = entryNamed(world, form.name);
      if (existing !== undefined && added.includes(existing.key)) return;
      const one =
        existing === undefined
          ? await make(form).then((m) => (m === null ? null : pickedOf(m)))
          : await pick(existing.source);
      if (one !== null) onPick([one]);
    };
    leave();
    openExerciseEditor(made, typed, (form) => void add(form));
  };
  const editOf = ({ source }: PickerEntry): (() => void) | undefined =>
    "grip" in source
      ? () => {
          leave();
          openGripEditor(source.grip.id);
        }
      : undefined;
  const newButton = (
    <Button
      label={t("workouts.newShort")}
      onPress={() => (newKind === "choose" ? setChoosing(true) : startNew(newKind))}
      variant="outline"
      icon="plus"
      height={44}
    />
  );

  return (
    <>
      <HangSheet
        visible
        onClose={onClose}
        closeLabel={t("common.cancel")}
        footer={
          multi && ticked.length > 0 ? (
            <Button
              label={t("workouts.addCount", { count: ticked.length })}
              onPress={() => void finish()}
              variant="primary"
              height={54}
            />
          ) : undefined
        }
      >
        <View style={{ gap: 12, paddingBottom: 12 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              paddingTop: 6,
            }}
          >
            <Title size={sheetTitleSize}>
              {multi ? t("workouts.addExercises") : t("workouts.swapExercise")}
            </Title>
            {newButton}
          </View>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t("workouts.searchExercises")}
            placeholderTextColor={colors.textFaint}
            accessibilityLabel={t("workouts.searchExercises")}
            returnKeyType="search"
            maxLength={80}
            style={[
              type.body,
              {
                height: 48,
                paddingHorizontal: 14,
                borderRadius: 12,
                fontSize: 15,
                color: colors.gunmetal,
                backgroundColor: colors.surfaceSoft,
              },
            ]}
          />
          {offer !== "grips" && (
            <ChipRow<Category>
              scroll
              value={category}
              onChange={setCategory}
              options={[
                { value: "all" as const, label: t("workouts.allCategories") },
                ...kinds.map((k) => ({ value: k, label: kindLabel(k), mark: KIND_COLORS[k] })),
              ]}
            />
          )}
          {entries.length === 0 ? (
            typed !== "" && (
              <View style={{ gap: 12, alignItems: "flex-start", paddingTop: 8 }}>
                <Text style={[type.body, { fontSize: 15, color: colors.textSecondary }]}>
                  {t("workouts.noExerciseCalled", { name: typed })}
                </Text>
                {newButton}
              </View>
            )
          ) : (
            <View>
              <Label color={colors.textSecondary}>{t("workouts.mostUsed")}</Label>
              {entries.map((entry) => (
                <PickerRow
                  key={entry.key}
                  entry={entry}
                  multi={multi}
                  ticked={ticked.some((e) => e.key === entry.key)}
                  onPress={() => press(entry)}
                  onEdit={editOf(entry)}
                />
              ))}
            </View>
          )}
        </View>
      </HangSheet>
      {choosing && (
        <ExerciseCategorySheet kinds={kinds} onPick={startNew} onClose={() => setChoosing(false)} />
      )}
    </>
  );
}
