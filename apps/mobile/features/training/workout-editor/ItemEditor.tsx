import React from "react";
import { Alert, Text, View } from "react-native";
import {
  letterOf,
  type ExerciseMeasure,
  type Item,
  type WeightUnit,
  type WorkoutKind,
} from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { Switch } from "../../../components/Switch";
import { IconButton } from "../components/IconButton";
import { type } from "../type";
import { DoseNameTile } from "./DoseNameTile";
import { DoseTile } from "./DoseTile";
import { doseFieldsFor, fieldText, withField } from "./doseFields";
import {
  MAX_DOSES,
  withAlternates,
  withDose,
  withDoseAdded,
  withDoseName,
  withoutLastDose,
  withSetRest,
} from "./editorState";
import { LetterBadge } from "../components/LetterBadge";
import { RestField } from "./RestField";

export type ItemEditorProps = {
  kind: WorkoutKind;
  item: Item;
  /** Its exercise or grip as the user reads it. */
  name: string;
  /** How its exercise is measured, when it is one of the user's own. */
  measure?: ExerciseMeasure;
  unit: WeightUnit;
  onChange: (item: Item) => void;
  onRemove: () => void;
  onSwap: () => void;
};

const KEYBOARD = {
  count: "number-pad",
  time: "numbers-and-punctuation",
  weight: "numbers-and-punctuation",
} as const;

/**
 * One exercise, or for hangboard one grip, on its own card: the numbers each of its doses
 * asks for by how it is measured, whether sessions take turns between them, and the rest
 * between its sets. Its menu swaps the exercise for another.
 */
export function ItemEditor({
  kind,
  item,
  name,
  measure,
  unit,
  onChange,
  onRemove,
  onSwap,
}: ItemEditorProps): React.ReactElement {
  const alternating = item.doses.length > 1;
  const next = letterOf(item.doses.length);
  const last = letterOf(item.doses.length - 1);
  const more = (): void =>
    Alert.alert(name, undefined, [
      { text: t("workouts.swapExercise"), onPress: onSwap },
      ...(alternating && item.doses.length < MAX_DOSES
        ? [
            {
              text: t("workouts.addDose", { letter: next }),
              onPress: () => onChange(withDoseAdded(item)),
            },
          ]
        : []),
      ...(item.doses.length > 2
        ? [
            {
              text: t("workouts.removeDose", { letter: last }),
              onPress: () => onChange(withoutLastDose(item)),
            },
          ]
        : []),
      {
        text: t("workouts.removeExercise", { name }),
        style: "destructive",
        onPress: onRemove,
      },
      { text: t("common.cancel"), style: "cancel" },
    ]);

  return (
    <View
      style={{
        gap: 10,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
      }}
    >
      <View style={{ minHeight: 36, flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Text style={[type.bodyBold, { flex: 1, fontSize: 16, color: colors.gunmetal }]}>
          {name}
        </Text>
        <IconButton
          icon="more"
          label={t("workouts.exerciseMore")}
          onPress={more}
          color={colors.textSecondary}
          size={36}
          iconSize={20}
        />
      </View>
      {item.doses.map((dose, d) => (
        <View key={d} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {alternating && <LetterBadge dose={d} size={26} />}
          <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {doseFieldsFor(kind, measure).map((field) => {
              const label = t(field.label, { unit });
              return (
                <DoseTile
                  key={field.key}
                  label={label}
                  accessibilityLabel={alternating ? `${label} ${letterOf(d)}` : label}
                  value={fieldText(field, dose, unit)}
                  keyboard={KEYBOARD[field.measure]}
                  placeholder={field.measure === "weight" ? t("hang.bodyweight") : undefined}
                  onCommit={(text) => {
                    const typed = withField(dose, field, text, unit);
                    if (typed !== null) onChange(withDose(item, d, typed));
                  }}
                />
              );
            })}
            {alternating && (
              <DoseNameTile
                name={dose.name ?? ""}
                accessibilityLabel={`${t("workouts.doseName")} ${letterOf(d)}`}
                onChange={(text) => onChange(withDoseName(item, d, text))}
              />
            )}
          </View>
        </View>
      ))}
      <View
        style={{
          minHeight: 44,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: colors.lineOnLightSoft,
        }}
      >
        <Text style={[type.body, { fontSize: 14, color: colors.gunmetal }]}>
          {t("workouts.alternates")}
        </Text>
        <Switch
          checked={alternating}
          onChange={(on) => onChange(withAlternates(item, on))}
          disabled={false}
          label={`${t("workouts.alternates")}: ${name}`}
        />
      </View>
      <RestField
        label={t("hang.fieldSetRest")}
        seconds={item.doses[0]?.setRestS ?? 0}
        onChange={(seconds) => onChange(withSetRest(item, seconds))}
      />
    </View>
  );
}
