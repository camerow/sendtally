import React from "react";
import { Pressable, Text, View } from "react-native";
import type { Item, WeightUnit, WorkoutKind } from "@sendtally/core/hang";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { TextInput } from "../../../components/TextInput";
import { press } from "../../../lib/press";
import { HangIcon } from "../components/HangIcon";
import { IconButton } from "../components/IconButton";
import { type } from "../type";
import { DoseTile } from "./DoseTile";
import { DOSE_FIELDS_OF, fieldText, withField } from "./doseFields";
import { needsWeight } from "./editorState";

export type ItemEditorProps = {
  kind: WorkoutKind;
  item: Item;
  unit: WeightUnit;
  gripName: (id: string) => string;
  onChange: (item: Item) => void;
  onRemove: () => void;
  onPickGrip: () => void;
};

const KEYBOARD = {
  count: "number-pad",
  time: "numbers-and-punctuation",
  weight: "numbers-and-punctuation",
} as const;

/** One exercise, or for hangboard one grip, and the numbers it asks for. */
export function ItemEditor({
  kind,
  item,
  unit,
  gripName,
  onChange,
  onRemove,
  onPickGrip,
}: ItemEditorProps): React.ReactElement {
  const name = kind === "hangboard" ? gripName(item.exercise) : item.exercise;
  const missing = needsWeight(kind, item);
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {kind === "hangboard" ? (
          <Pressable
            onPress={onPickGrip}
            accessibilityRole="button"
            accessibilityLabel={`${t("hang.chooseAGrip")}: ${name}`}
            style={press({
              flex: 1,
              height: 44,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            })}
          >
            <Text style={[type.bodyBold, { fontSize: 16, color: colors.gunmetal }]}>{name}</Text>
            <HangIcon name="down" color={colors.textSecondary} size={16} strokeWidth={2.2} />
          </Pressable>
        ) : (
          <TextInput
            value={item.exercise}
            onChangeText={(exercise) => onChange({ ...item, exercise })}
            placeholder={t("workouts.exercisePlaceholder")}
            placeholderTextColor={colors.textFaint}
            accessibilityLabel={t("workouts.exercise")}
            maxLength={80}
            style={{
              flex: 1,
              height: 44,
              paddingHorizontal: 12,
              borderRadius: radius.control,
              borderWidth: 1,
              borderColor: colors.lineOnLightStrong,
              fontFamily: fonts.sansSemiBold,
              fontSize: 15,
              color: colors.gunmetal,
            }}
          />
        )}
        <IconButton
          icon="x"
          label={t("workouts.removeExercise", { name: name || t("workouts.exercise") })}
          onPress={onRemove}
          color={colors.textSecondary}
          size={36}
        />
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {DOSE_FIELDS_OF[kind].map((field) => (
          <DoseTile
            key={field.key}
            label={t(field.label, { unit })}
            value={fieldText(field, item.dose, unit)}
            keyboard={KEYBOARD[field.measure]}
            required={missing && field.key === "weightKg"}
            onCommit={(text) => {
              const dose = withField(item.dose, field, text, unit);
              if (dose !== null) onChange({ ...item, dose });
            }}
          />
        ))}
      </View>
      {missing && (
        <Text style={[type.body, { fontSize: 13, color: colors.watermelonInk }]}>
          {t("workouts.weightNeeded")}
        </Text>
      )}
    </View>
  );
}
