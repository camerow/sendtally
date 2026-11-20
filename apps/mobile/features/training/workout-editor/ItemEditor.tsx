import React from "react";
import { Text, View } from "react-native";
import { letterOf, type Item, type WeightUnit, type WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { Switch } from "../../../components/Switch";
import { DetailMenu } from "../components/DetailMenu";
import { IconButton } from "../components/IconButton";
import type { DetailMenuRow } from "../components/types";
import { type } from "../type";
import { DoseNameTile } from "./DoseNameTile";
import { DoseInput } from "./DoseInput";
import { doseFieldsFor, fieldPlaceholder, type DoseMeasure } from "@sendtally/features/workouts";
import {
  MAX_DOSES,
  withAlternates,
  withDose,
  withDoseAdded,
  withDoseName,
  withoutLastDose,
  withLapUnit,
  withSetRest,
} from "@sendtally/features/workouts";
import { LetterBadge } from "../components/LetterBadge";
import { UnitToggle } from "../../log-session/UnitToggle";
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
  /** Absent where the card offers no swap. */
  onSwap?: () => void;
  /** Shown beside the name, such as a Yours tag. */
  tag?: React.ReactNode;
  /** Only shows the card, as the exercise editor previews it: no move, swap or remove. */
  preview?: boolean;
  /** Absent for the first item. */
  onMoveUp?: () => void;
  /** Absent for the last item. */
  onMoveDown?: () => void;
  /**
   * A superset member, by its letter's place (A is 0): its sets are the superset's rounds, so they are not asked, and its − takes
   * it out of the superset, saying so, rather than out of the workout.
   */
  member?: number;
  /** The wizard's card: one row of numbers per dose, no target RPE or dose name, and Remove in the menu. */
  compact?: boolean;
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
  onMoveUp,
  onMoveDown,
  preview = false,
  member,
  tag,
  compact = false,
}: ItemEditorProps): React.ReactElement {
  const alternating = item.doses.length > 1;
  const next = letterOf(item.doses.length);
  const last = letterOf(item.doses.length - 1);
  const fields = doseFieldsFor(kind, measure, item.doses[0]).filter(
    (f) => (member === undefined || f.key !== "sets") && !(compact && f.key === "targetRpe")
  );
  const laps = measure === "laps";
  const { slot } = useFieldOrder([
    ...item.doses.flatMap((_, d) => fields.map((f) => `${d}.${f.key}`)),
    "setRest",
  ]);
  const remove: DetailMenuRow = {
    icon: "trash",
    title:
      member !== undefined
        ? t("workouts.outOfSuperset", { name })
        : t("workouts.removeExercise", { name }),
    danger: true,
    onPress: onRemove,
  };
  const menu: DetailMenuRow[] = [
    ...(onSwap === undefined
      ? []
      : [{ icon: "refresh" as const, title: t("workouts.swapExercise"), onPress: onSwap }]),
    ...(item.doses.length < MAX_DOSES
      ? [
          {
            icon: "plus" as const,
            title: t("workouts.addDose", { letter: next }),
            onPress: () => onChange(withDoseAdded(item)),
          },
        ]
      : []),
    ...(item.doses.length > 2
      ? [
          {
            icon: "x" as const,
            title: t("workouts.removeDose", { letter: last }),
            onPress: () => onChange(withoutLastDose(item)),
          },
        ]
      : []),
    remove,
  ];

  const rest = (
    <TimeField
      {...slot("setRest")}
      label={laps ? t("workouts.lapRest") : t("hang.fieldSetRest")}
      value={item.doses[0]?.setRestS ?? 0}
      max={3600}
      onChange={(seconds) => onChange(withSetRest(item, seconds))}
    />
  );

  return (
    <View
      style={{
        gap: 10,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
        backgroundColor: member !== undefined ? colors.white : undefined,
      }}
    >
      <View style={{ minHeight: 36, flexDirection: "row", alignItems: "center", gap: 6 }}>
        {member !== undefined && <LetterBadge dose={member} size={26} plain />}
        <Text style={[type.bodyBold, { flex: 1, fontSize: 16, color: colors.gunmetal }]}>
          {name}
        </Text>
        {tag}
        {onMoveUp !== undefined && (
          <IconButton
            icon="moveUp"
            label={t("workouts.moveUp", { name })}
            onPress={onMoveUp}
            color={colors.textSecondary}
            size={36}
            iconSize={18}
          />
        )}
        {onMoveDown !== undefined && (
          <IconButton
            icon="moveDown"
            label={t("workouts.moveDown", { name })}
            onPress={onMoveDown}
            color={colors.textSecondary}
            size={36}
            iconSize={18}
          />
        )}
        {preview ? null : alternating || compact ? (
          <DetailMenu
            rows={compact ? [remove] : menu}
            button={{
              label: t("workouts.exerciseMore"),
              color: colors.textSecondary,
              size: 36,
              iconSize: 20,
            }}
          />
        ) : (
          <>
            {onSwap !== undefined && (
              <IconButton
                icon="restart"
                label={t("workouts.swapExercise")}
                onPress={onSwap}
                color={colors.textSecondary}
                size={36}
                iconSize={18}
              />
            )}
            <IconButton
              icon="remove"
              label={
                member !== undefined
                  ? t("workouts.outOfSuperset", { name })
                  : t("workouts.removeExercise", { name })
              }
              onPress={onRemove}
              color={colors.textSecondary}
              size={36}
              iconSize={18}
            />
          </>
        )}
      </View>
      {laps && (
        <View
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
        >
          <Text style={[type.body, { fontSize: 14, color: colors.gunmetal }]}>
            {t("endurance.oneLapIs")}
          </Text>
          <UnitToggle
            value={item.doses[0]?.onS === undefined ? "moves" : "seconds"}
            onChange={(unit) => onChange(withLapUnit(item, unit))}
          />
        </View>
      )}
      {item.doses.map((dose, d) => (
        <View key={d} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {alternating && <LetterBadge dose={d} size={26} />}
          <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {fields.map((field) => {
              const label = t(field.label);
              return (
                <DoseInput
                  key={field.key}
                  compact={compact}
                  {...slot(`${d}.${field.key}`)}
                  field={field}
                  dose={dose}
                  unit={unit}
                  label={label}
                  accessibilityLabel={alternating ? `${label} ${letterOf(d)}` : label}
                  placeholder={fieldPlaceholder(field)}
                  onChange={(typed) => onChange(withDose(item, d, typed))}
                />
              );
            })}
            {alternating && !compact && (
              <DoseNameTile
                name={dose.name ?? ""}
                accessibilityLabel={`${t("workouts.doseName")} ${letterOf(d)}`}
                onChange={(text) => onChange(withDoseName(item, d, text))}
              />
            )}
            {!alternating && !compact && fields.length % 2 === 1 && (
              <View testID="dose-spacer" style={{ flexGrow: 1, flexBasis: "40%" }} />
            )}
          </View>
        </View>
      ))}
      {member === undefined && (
        <>
          {compact && <View style={{ width: "40%" }}>{rest}</View>}
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
          {!compact && rest}
        </>
      )}
    </View>
  );
}
