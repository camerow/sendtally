import { router } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import type { WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { kindLabel } from "@sendtally/features/activities";
import { pickerEntries, type PickerEntry } from "@sendtally/features/exercises";
import { t } from "@sendtally/features/i18n";
import { DashedPanel } from "../components/DashedPanel";
import { IconButton } from "../components/IconButton";
import { Title } from "../components/Title";
import { useHangData } from "../data/HangDataContext";
import { PickerRow } from "../exercise-picker/PickerRow";
import { usePickerWorld } from "../exercise-picker/usePickerWorld";
import { CategoryMark } from "../library/CategoryMark";
import { LibrarySearch } from "../library/LibrarySearch";
import { ScreenFrame } from "../../../components/ScreenFrame";
import { openGrip } from "../train/openGrip";
import { type } from "../type";
import { openExerciseEditor } from "./openExerciseEditor";

export type ExerciseCategoryScreenProps = { kind: WorkoutKind };

const mine = ({ source }: PickerEntry): boolean =>
  "exercise" in source || ("grip" in source && source.grip.custom);

/**
 * All of one category's exercises, the user's own badged among the starter ones, the most
 * used first, to search; the plus makes a new one in it.
 */
export function ExerciseCategoryScreen({ kind }: ExerciseCategoryScreenProps): React.ReactElement {
  const { model } = useHangData();
  const world = usePickerWorld([], kind === "hangboard");
  const [text, setText] = React.useState("");
  const label = kindLabel(kind);
  const entries = pickerEntries(world, { category: kind, text });
  const open = ({ source }: PickerEntry): (() => void) | undefined =>
    "exercise" in source
      ? () => router.push({ pathname: "/exercise/[id]", params: { id: source.exercise.id } })
      : "grip" in source
        ? openGrip(model.sessions, source.grip.id)
        : undefined;

  return (
    <ScreenFrame
      action={
        <IconButton
          icon="plus"
          label={t("workouts.newExerciseIn", { category: label })}
          onPress={() => openExerciseEditor(kind)}
          color={colors.gunmetal}
          border={colors.lineOnLightStrong}
          size={30}
        />
      }
    >
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <CategoryMark kind={kind} />
          <Title size={34} style={{ flex: 1 }}>
            {label}
          </Title>
        </View>
        <Text style={[type.body, { fontSize: 14, lineHeight: 20, color: colors.textSecondary }]}>
          {t(`workouts.categoryEmpty.${kind}`)}
        </Text>
      </View>
      <View style={{ gap: 4 }}>
        <LibrarySearch
          value={text}
          onChange={setText}
          placeholder={t("focus.search", { focus: label })}
        />
        {entries.length === 0 ? (
          <DashedPanel
            title={t("workouts.noResultsTitle")}
            body={t("workouts.noExerciseCalled", { name: text.trim() })}
          />
        ) : (
          entries.map((entry) => (
            <PickerRow
              key={entry.key}
              entry={entry}
              multi={false}
              ticked={false}
              mine={mine(entry)}
              onPress={open(entry)}
            />
          ))
        )}
      </View>
    </ScreenFrame>
  );
}
