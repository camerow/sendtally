import React from "react";
import { Text, View } from "react-native";
import { WORKOUT_KINDS, type Item, type WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { kindLabel } from "@sendtally/features/activities";
import {
  entryNamed,
  pickerEntries,
  type PickerEntry,
  type PickerWorld,
} from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import { useExerciseSeries, useExercises } from "@sendtally/features/statistics";
import { TextInput } from "../../../components/TextInput";
import { useApi } from "../../../lib/api";
import { Button } from "../components/Button";
import { ChipRow } from "../components/ChipRow";
import { Label } from "../components/Label";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { HangSheet } from "../data/HangSheet";
import { ExerciseSheet } from "../exercises/ExerciseSheet";
import { useMakeExercise } from "../exercises/useMakeExercise";
import { KIND_COLORS } from "../insights/kindColors";
import { type } from "../type";
import { PickerRow } from "./PickerRow";
import type { Picked } from "./types";
import { pickedOf, usePick } from "./usePick";

export type ExercisePickerSheetProps = {
  /** The workout's kind: the category the picker starts on. */
  kind: WorkoutKind;
  /** The workout's items, tagged in the list. */
  items: readonly Item[];
  /** Tick several and add them; otherwise a tap picks one, to swap. */
  multi: boolean;
  onPick: (picked: Picked[]) => void;
  onClose: () => void;
};

type Category = WorkoutKind | "all";

const NOT_FINGERS = WORKOUT_KINDS.filter((k) => k !== "hangboard");

/**
 * The exercise library, to build a workout from: search, a category or all, the most used
 * first. Ticked exercises are added in the order they were ticked; New makes one from
 * what was typed and adds it once saved. A Fingers workout picks grips, any other the rest.
 */
export function ExercisePickerSheet({
  kind,
  items,
  multi,
  onPick,
  onClose,
}: ExercisePickerSheetProps): React.ReactElement {
  const api = useApi();
  const { model } = useHangData();
  const exercises = useExercises(api).state;
  const series = useExerciseSeries(api);
  const pick = usePick();
  const make = useMakeExercise();
  const fingers = kind === "hangboard";
  const [text, setText] = React.useState("");
  const [category, setCategory] = React.useState<Category>(kind);
  const [ticked, setTicked] = React.useState<PickerEntry[]>([]);
  const [making, setMaking] = React.useState(false);

  const uses = new Map<string, number>();
  if (series.status === "ready") for (const s of series.data) uses.set(s.key, s.sessions.length);
  for (const s of model.sessions) uses.set(s.gripId, (uses.get(s.gripId) ?? 0) + 1);
  const world: PickerWorld = {
    mine: exercises.status === "ready" ? exercises.data : [],
    grips: model.grips.filter((g) => !g.hidden),
    uses,
    inWorkout: items.map((i) => i.exercise),
    fingers,
  };
  const entries = pickerEntries(world, { category, text });
  const typed = text.trim();

  const finish = async (more: Picked[] = []): Promise<void> => {
    onClose();
    const picked = await Promise.all(ticked.map((e) => pick(e.source)));
    onPick([...picked.filter((p) => p !== null), ...more]);
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
  const made = async (form: Parameters<typeof make>[0]): Promise<void> => {
    const existing = entryNamed(world, form.name);
    const one =
      existing === undefined
        ? await make(form).then((m) => (m === null ? null : pickedOf(m)))
        : await pick(existing.source);
    if (one === null) return;
    if (multi) await finish(ticked.some((e) => e.key === existing?.key) ? [] : [one]);
    else {
      onClose();
      onPick([one]);
    }
  };
  const newButton = (
    <Button
      label={t("workouts.newShort")}
      onPress={() => setMaking(true)}
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
            <Title size={26}>
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
          {!fingers && (
            <ChipRow<Category>
              scroll
              value={category}
              onChange={setCategory}
              options={[
                ...NOT_FINGERS.map((k) => ({
                  value: k,
                  label: kindLabel(k),
                  mark: KIND_COLORS[k],
                })),
                { value: "all" as const, label: t("workouts.allCategories") },
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
                />
              ))}
            </View>
          )}
        </View>
      </HangSheet>
      {making && (
        <ExerciseSheet
          initial={{ kind: category === "all" ? kind : category, name: typed }}
          kinds={fingers ? ["hangboard"] : NOT_FINGERS}
          onSave={(form) => void made(form)}
          onClose={() => setMaking(false)}
        />
      )}
    </>
  );
}
