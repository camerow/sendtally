import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { Label } from "../components/Label";
import { SET_COLUMNS } from "./setColumns";

export type SetHeadingsProps = {
  /** Over the positions: "Set", "Lap". */
  position: string;
  /** Over the fields: "Done", "Hold". */
  fields: string;
  /** The block asks a set RPE. */
  rpe?: boolean;
};

/** The set grid's column headings, on the same columns as its rows. */
export function SetHeadings({
  position,
  fields,
  rpe = false,
}: SetHeadingsProps): React.ReactElement {
  return (
    <View style={[SET_COLUMNS.row, { minHeight: 20 }]}>
      <Label small color={colors.textSecondary} style={SET_COLUMNS.position}>
        {position}
      </Label>
      <Label small color={colors.textSecondary} style={{ flex: 1 }}>
        {fields}
      </Label>
      {rpe && (
        <Label small color={colors.textSecondary} style={SET_COLUMNS.rpe}>
          RPE
        </Label>
      )}
      <View style={{ width: SET_COLUMNS.tick.width }} />
    </View>
  );
}
