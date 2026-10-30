import React from "react";
import { View } from "react-native";
import type { Dose, WeightUnit, WorkoutKind } from "@sendtally/core/hang";
import {
  columnLabel,
  loadColumns,
  weekFields,
  type DoneCount,
  type DoseField,
} from "@sendtally/features/training";
import { t } from "@sendtally/features/i18n";
import { Chip } from "../../../components/Chip";
import { Button } from "../components/Button";
import { LoadTable } from "./LoadTable";

export type ItemLoadProps = {
  kind: WorkoutKind;
  /** The item as written. */
  written: Dose;
  /** Each block week's change to it, first week first. */
  changes: readonly Partial<Dose>[];
  unit: WeightUnit;
  current: number | null;
  done: readonly (DoneCount | null)[];
  onChange: (week: number, change: Partial<Dose>) => void;
  /** Left of + Column, such as the table's heading. */
  header?: React.ReactNode;
};

/** One item's weekly load: + Column for a number its dose does not show yet, and the table. */
export function ItemLoad({
  kind,
  written,
  changes,
  header,
  ...table
}: ItemLoadProps): React.ReactElement {
  const [added, setAdded] = React.useState<DoseField[]>([]);
  const [adding, setAdding] = React.useState(false);
  const columns = loadColumns(kind, written, changes, added);
  const more = weekFields(kind, written).filter((f) => !columns.includes(f));
  return (
    <View style={{ gap: 10 }}>
      {(header !== undefined || more.length > 0) && (
        <View
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
        >
          {header ?? <View />}
          {more.length > 0 && (
            <Button
              label={`+ ${t("plan.addColumn")}`}
              onPress={() => setAdding(!adding)}
              variant="link"
              height={36}
            />
          )}
        </View>
      )}
      {adding && more.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {more.map((f) => (
            <Chip
              key={f}
              label={columnLabel(kind, written, f)}
              uppercase={false}
              active={false}
              onPress={() => {
                setAdded([...added, f]);
                setAdding(false);
              }}
            />
          ))}
        </View>
      )}
      <LoadTable kind={kind} written={written} changes={changes} columns={columns} {...table} />
    </View>
  );
}
