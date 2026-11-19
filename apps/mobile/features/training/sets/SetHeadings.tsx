import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { Label } from "../components/Label";
import { SET_COLUMNS } from "./setColumns";

export type SetHeadingsProps = {
  /** Over the positions: "Set", "Lap". */
  position: string;
  /** Over the fields, or over the count column when `measure` is given: "Done", "Hold", "Hangs". */
  fields: string;
  /** Over the measure column: "Load". */
  measure?: string;
  /** The block asks a set RPE. */
  rpe?: boolean;
  /** Its rows end in a tick; a hang set's rows end at RPE. */
  tick?: boolean;
};

/** The set grid's column headings, on the same columns as its rows. */
export function SetHeadings({
  position,
  fields,
  measure,
  rpe = false,
  tick = true,
}: SetHeadingsProps): React.ReactElement {
  return (
    <View style={[SET_COLUMNS.row, { minHeight: 20 }]}>
      <Label small color={colors.textSecondary} style={SET_COLUMNS.position}>
        {position}
      </Label>
      {measure === undefined ? (
        <Label small color={colors.textSecondary} style={{ flex: 1 }}>
          {fields}
        </Label>
      ) : (
        <View style={SET_COLUMNS.lead}>
          <Label small color={colors.textSecondary} style={SET_COLUMNS.count}>
            {fields}
          </Label>
          <View style={SET_COLUMNS.join} />
          <Label small color={colors.textSecondary} style={SET_COLUMNS.measure}>
            {measure}
          </Label>
        </View>
      )}
      {rpe && (
        <Label small color={colors.textSecondary} style={SET_COLUMNS.rpe}>
          RPE
        </Label>
      )}
      {tick && <View style={{ width: SET_COLUMNS.tick.width }} />}
    </View>
  );
}
