import React from "react";
import { changeFrom, type Dose, type WeightUnit, type WorkoutKind } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import {
  cellText,
  columnLabel,
  weekFieldLimits,
  weekFieldValue,
  withWeekField,
  type DoneCount,
  type WeekField,
  doneAll,
  doneText,
  isTimeField,
  weekFieldMarked,
  weekFieldUnit,
} from "@sendtally/features/training";
import { NumberField } from "../../components/NumberField";

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
  /** Each cell a typable field; plain numbers while reading. */
  editing: boolean;
  onChange: (week: number, change: Partial<Dose>) => void;
};

/**
 * An item's weeks in a block as a table: a row per week, a column per number, gold where a
 * week differs from the workout as written. Editing, each cell is typed or stepped with ↑ ↓.
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
  const unitOf = (f: WeekField): string | null => weekFieldUnit(f, unit);
  const headOf = (f: WeekField): string => {
    const name = columnLabel(kind, written, f);
    const shown = unitOf(f);
    return shown === null ? name : `${name} · ${shown}`;
  };
  return (
    <table className="load-table">
      <thead>
        <tr>
          <th aria-hidden="true" />
          {columns.map((f) => (
            <th key={f} scope="col" className="plan-label-small plan-label--muted">
              {headOf(f)}
            </th>
          ))}
          {done !== null && (
            <th scope="col" className="plan-label-small plan-label--muted load-done">
              {t("plan.done")}
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {changes.map((change, i) => {
          const week = i + 1;
          const dose = { ...written, ...change };
          const ran = done?.[i] ?? null;
          return (
            <tr key={week} className={week === current ? "load-row load-row--now" : "load-row"}>
              <th scope="row" className="plan-label load-week">
                {t("plan.weekShort", { n: week })}
              </th>
              {columns.map((f) => {
                const marked = weekFieldMarked(change, written, f);
                const text = cellText(kind, dose, f, unit);
                const unitShown = unitOf(f);
                return (
                  <td
                    key={f}
                    className={marked ? "load-cell load-cell--marked" : "load-cell"}
                    title={
                      marked
                        ? `${t("plan.asWritten")} ${cellText(kind, written, f, unit)}`
                        : undefined
                    }
                  >
                    {editing ? (
                      <NumberField
                        compact
                        label={t("plan.cellAria", {
                          n: week,
                          field: columnLabel(kind, written, f),
                        })}
                        value={weekFieldValue(dose, f, unit)}
                        mode={
                          isTimeField(f)
                            ? { kind: "time" }
                            : { kind: "number", ...weekFieldLimits(f, unit) }
                        }
                        {...(unitShown !== null && { unit: unitShown })}
                        onChange={(typed) => {
                          const next = withWeekField(dose, f, typed, unit);
                          if (next !== null) onChange(week, changeFrom(written, next));
                        }}
                      />
                    ) : (
                      <span className="load-value">{text}</span>
                    )}
                  </td>
                );
              })}
              {done !== null && (
                <td className={doneAll(ran) ? "load-done load-done--all" : "load-done"}>
                  {doneText(ran)}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
