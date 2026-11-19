import React from "react";
import { View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { FLOATING, FloatingBar } from "../../../components/FloatingBar";
import { Button } from "./Button";
import { DetailMenu } from "./DetailMenu";
import type { DetailMenuRow } from "./types";

export type DetailActionsProps = {
  /** Opens the thing's history view. */
  onHistory?: () => void;
  /** Opens the thing's editor; Edit unless a label says otherwise. */
  onEdit?: () => void;
  editLabel?: string;
  menu?: readonly DetailMenuRow[];
};

/** A detail screen's bar, right of Back: History, Edit when it can change, then ··· when it has more. */
export function DetailActions({
  onHistory,
  onEdit,
  editLabel,
  menu = [],
}: DetailActionsProps): React.ReactElement {
  const floating = React.useContext(FloatingBar);
  const button = (label: string, onPress: () => void): React.ReactElement => (
    <Button
      label={label}
      onPress={onPress}
      variant={floating ? "plain" : "outline"}
      height={40}
      style={floating && [FLOATING, { borderRadius: 20 }]}
    />
  );
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: floating ? 8 : 4 }}>
      {onHistory !== undefined && button(t("common.history"), onHistory)}
      {onEdit !== undefined && button(editLabel ?? t("common.edit"), onEdit)}
      {menu.length > 0 && (
        <View style={floating && [FLOATING, { borderRadius: 22 }]}>
          <DetailMenu rows={menu} />
        </View>
      )}
    </View>
  );
}
