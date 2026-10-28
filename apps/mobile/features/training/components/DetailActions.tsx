import React from "react";
import { View } from "react-native";
import { t } from "@sendtally/features/i18n";
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
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      {onEdit !== undefined && (
        <Button
          label={editLabel ?? t("common.edit")}
          onPress={onEdit}
          variant="outline"
          height={40}
        />
      )}
      {menu.length > 0 && <DetailMenu rows={menu} />}
    </View>
  );
}
