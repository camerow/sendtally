import React from "react";
import { View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { Icon } from "../../../components/Icon";

export type CheckBoxProps = { checked: boolean; color: string };

/** The tick box a player's rows carry; the row around it takes the press. */
export function CheckBox({ checked, color }: CheckBoxProps): React.ReactElement {
  return (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: checked ? 0 : 1.5,
        borderColor: colors.lineOnLightStrong,
        backgroundColor: checked ? color : undefined,
      }}
    >
      {checked && <Icon name="check" color={colors.white} size={16} strokeWidth={3} />}
    </View>
  );
}
