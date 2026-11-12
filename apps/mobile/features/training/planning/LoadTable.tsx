import React from "react";
import { Text, View } from "react-native";
import { changeFrom, type Dose, type WeightUnit, type WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import {
  cellText,
  columnLabel,
  weekFieldLimits,
  weekFieldValue,
  withWeekField,
  type DoneCount,
  type WeekField,
} from "@sendtally/features/training";
import { KeypadField } from "../../../components/KeypadField";
import { useFieldOrder } from "../../../components/useFieldOrder";
import { Label } from "../components/Label";
import { GOLD_TINT } from "../components/tints";
import { type } from "../type";

export type LoadTableProps = {
  kind: WorkoutKind;
  /** The item as written. */
  written: Dose;
  /** Each block week's change to it, first week first. */
  changes: readonly Partial<Dose>[];
  columns: readonly WeekField[];
  unit: WeightUnit;
  /** This week of the block, drawn on the soft fill; null outside it. */
  current: number | null;
  /** Each week's runs, done of planned; null for a week still to come. None on a template. */
  done: readonly (DoneCount | null)[] | null;
  /** Each cell a field on the keypad; plain numbers while reading. */
  editing: boolean;
  onChange: (week: number, change: Partial<Dose>) => void;
};

const WEEK = 34;
const DONE = 44;
const TIMES: readonly WeekField[] = ["onS", "offS", "setRestS"];

const without = (change: Partial<Dose>, field: WeekField): Partial<Dose> =>
  Object.fromEntries(Object.entries(change).filter(([k]) => k !== field));

/**
 * An item's weeks in a block as a table: a row per week, a column per number, gold where a
 * week differs from the workout as written. Editing, a cell types on the keypad and Next walks
 * down its column.
 */
export function LoadTable({
  kind,
  written,
  changes,
  columns,
  unit,
  current,
  done,
  editing,
  onChange,
}: LoadTableProps): React.ReactElement {
  const weeks = changes.map((_, i) => i + 1);
  const { slot } = useFieldOrder(columns.flatMap((f) => weeks.map((w) => `${f}:${w}`)));
  const headOf = (f: WeekField): string => {
    const name = columnLabel(kind, written, f);
    const shown = f === "weightKg" ? unit : f === "edgeMm" ? "mm" : null;
    return shown === null ? name : `${name} · ${shown}`;
  };
  const head = (text: string, width?: number): React.ReactElement => (
    <Label
      small
      color={colors.textSecondary}
      style={[{ textAlign: "center" }, width === undefined ? { flex: 1 } : { width }]}
    >
      {text}
    </Label>
  );

  return (
    <View style={{ gap: 2 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <View style={{ width: WEEK }} />
        {columns.map((f) => (
          <React.Fragment key={f}>{head(headOf(f))}</React.Fragment>
        ))}
        {done !== null && head(t("plan.done"), DONE)}
      </View>
      {weeks.map((week) => {
        const change = changes[week - 1] ?? {};
        const dose = { ...written, ...change };
        const ran = done?.[week - 1] ?? null;
        return (
          <View
            key={week}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingVertical: 4,
              borderRadius: 10,
              backgroundColor: week === current ? colors.surfaceSoft : undefined,
            }}
          >
            <Label color={colors.gunmetal} style={{ width: WEEK, paddingLeft: 6 }}>
              {t("plan.weekShort", { n: week })}
            </Label>
            {columns.map((f) => {
              const name = columnLabel(kind, written, f);
              const marked = change[f] !== undefined && change[f] !== written[f];
              if (!editing)
                return (
                  <View key={f} style={{ flex: 1, alignItems: "center" }}>
                    <Text
                      style={[
                        type.mono,
                        {
                          fontSize: 13,
                          paddingHorizontal: 4,
                          borderRadius: 4,
                          overflow: "hidden",
                          color: colors.gunmetal,
                          backgroundColor: marked ? GOLD_TINT : undefined,
                        },
                      ]}
                    >
                      {cellText(kind, dose, f, unit)}
                    </Text>
                  </View>
                );
              return (
                <KeypadField
                  key={f}
                  {...slot(`${f}:${week}`)}
                  cell={{ marked }}
                  label={`${t("plan.weekShort", { n: week })} · ${name}`}
                  accessibilityLabel={t("plan.cellAria", { n: week, field: name })}
                  mode={
                    TIMES.includes(f)
                      ? { kind: "time" }
                      : {
                          kind: "number",
                          unit: f === "weightKg" ? unit : f === "edgeMm" ? "mm" : undefined,
                          ...weekFieldLimits(f, unit),
                        }
                  }
                  value={weekFieldValue(dose, f, unit)}
                  text={["", cellText(kind, dose, f, unit)]}
                  note={`${t("plan.asWritten")} ${cellText(kind, written, f, unit)}`}
                  onReset={marked ? () => onChange(week, without(change, f)) : undefined}
                  onChange={(typed) => {
                    const next = withWeekField(dose, f, typed, unit);
                    if (next !== null) onChange(week, changeFrom(written, next));
                  }}
                />
              );
            })}
            {done !== null && (
              <Text
                style={[
                  type.mono,
                  {
                    width: DONE,
                    fontSize: 12,
                    textAlign: "center",
                    color:
                      ran !== null && ran.planned > 0 && ran.done >= ran.planned
                        ? colors.fern
                        : colors.textSecondary,
                  },
                ]}
              >
                {ran === null || ran.planned === 0 ? "" : `${ran.done}/${ran.planned}`}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}
