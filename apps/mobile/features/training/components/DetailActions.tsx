import React from "react";
import { View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { FLOATING, FloatingBar } from "../../../components/FloatingBar";
import { Button } from "./Button";
import { DetailMenu } from "./DetailMenu";
import type { DetailMenuRow } from "./types";

export type DetailActionsProps = {
  /** Opens the thing's editor; Edit unless a label says otherwise. */
  onEdit?: () => void;
  editLabel?: string;
  menu?: readonly DetailMenuRow[];
};

/** A detail screen's bar, right of Back: Edit when it can change, then ··· when it has more. */
export function DetailActions({
  onEdit,
  editLabel,
  menu = [],
}: DetailActionsProps): React.ReactElement {
  const floating = React.useContext(FloatingBar);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: floating ? 8 : 4 }}>
      {onEdit !== undefined && (
        <Button
          label={editLabel ?? t("common.edit")}
          onPress={onEdit}
          variant={floating ? "plain" : "outline"}
          height={40}
          style={floating && [FLOATING, { borderRadius: 20 }]}
        />
      )}
      {menu.length > 0 && (
        <View style={floating && [FLOATING, { borderRadius: 22 }]}>
          <DetailMenu rows={menu} />
        </View>
      )}
    </View>
  );
}
