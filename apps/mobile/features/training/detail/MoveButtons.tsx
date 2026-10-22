import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { IconButton } from "../components/IconButton";

export type MoveButtonsProps = {
  first: boolean;
  last: boolean;
  onMove: (direction: -1 | 1) => void;
};

/** Up and down for one entry of a list, each held open as a gap at its end of the list. */
export function MoveButtons({ first, last, onMove }: MoveButtonsProps): React.ReactElement {
  return (
    <View>
      {first ? (
        <View style={{ width: 44, height: 44 }} />
      ) : (
        <IconButton
          icon="up"
          label={t("activities.moveUp")}
          onPress={() => onMove(-1)}
          color={colors.textSecondary}
        />
      )}
      {last ? (
        <View style={{ width: 44, height: 44 }} />
      ) : (
        <IconButton
          icon="down"
          label={t("activities.moveDown")}
          onPress={() => onMove(1)}
          color={colors.textSecondary}
        />
      )}
    </View>
  );
}
