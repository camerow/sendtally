import React from "react";
import { Alert, Text, View } from "react-native";
import { letterOf, type Item, type WeightUnit, type WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { Switch } from "../../../components/Switch";
import { IconButton } from "../components/IconButton";
import { type } from "../type";
import { DoseNameTile } from "./DoseNameTile";
import { DoseInput } from "./DoseInput";
import { doseFieldsFor, type DoseMeasure } from "./doseFields";
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
import { TimeField } from "../../../components/TimeField";
import { useFieldOrder } from "../../../components/useFieldOrder";

export type ItemEditorProps = {
  kind: WorkoutKind;
  item: Item;
  /** Its exercise or grip as the user reads it. */
  name: string;
  /** How its exercise is measured, when it is one of the user's own. */
  measure?: DoseMeasure;
  unit: WeightUnit;
  onChange: (item: Item) => void;
  onRemove: () => void;
  onSwap: () => void;
};

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
  const fields = doseFieldsFor(kind, measure);
  const { slot } = useFieldOrder([
    ...item.doses.flatMap((_, d) => fields.map((f) => `${d}.${f.key}`)),
    "setRest",
  ]);
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
        {alternating ? (
          <IconButton
            icon="more"
            label={t("workouts.exerciseMore")}
            onPress={more}
            color={colors.textSecondary}
            size={36}
            iconSize={20}
          />
        ) : (
          <>
            <IconButton
              icon="restart"
              label={t("workouts.swapExercise")}
              onPress={onSwap}
              color={colors.textSecondary}
              size={36}
              iconSize={18}
            />
            <IconButton
              icon="remove"
              label={t("workouts.removeExercise", { name })}
              onPress={onRemove}
              color={colors.textSecondary}
              size={36}
              iconSize={18}
            />
          </>
        )}
      </View>
      {item.doses.map((dose, d) => (
        <View key={d} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {alternating && <LetterBadge dose={d} size={26} />}
          <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {fields.map((field) => {
              const label = t(field.label);
              return (
                <DoseInput
                  key={field.key}
                  {...slot(`${d}.${field.key}`)}
                  field={field}
                  dose={dose}
                  unit={unit}
                  label={label}
                  accessibilityLabel={alternating ? `${label} ${letterOf(d)}` : label}
                  placeholder={
                    field.measure === "weight"
                      ? t("hang.bodyweight")
                      : field.placeholder === undefined
                        ? undefined
                        : t(field.placeholder)
                  }
                  onChange={(typed) => onChange(withDose(item, d, typed))}
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
      <TimeField
        {...slot("setRest")}
        label={t("hang.fieldSetRest")}
        value={item.doses[0]?.setRestS ?? 0}
        max={3600}
        onChange={(seconds) => onChange(withSetRest(item, seconds))}
      />
    </View>
  );
}
