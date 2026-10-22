import React from "react";
import { Pressable, Text } from "react-native";
import { colors, radius } from "@sendtally/design/tokens";
import { sideLabel, type Side } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { press } from "../../../lib/press";
import { type } from "../type";

export type SideToggleProps = { value: Side | undefined; onChange: (side: Side) => void };

/** Left or right; each tap swaps sides, the first picks left. */
export function SideToggle({ value, onChange }: SideToggleProps): React.ReactElement {
  return (
    <Pressable
      onPress={() => onChange(value === "L" ? "R" : "L")}
      accessibilityRole="button"
      accessibilityLabel={[t("activities.measureSide"), value === undefined ? "" : sideLabel(value)]
        .filter((p) => p !== "")
        .join(", ")}
      style={press({
        flex: 1,
        minWidth: 0,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: colors.lineOnLightStrong,
        borderRadius: radius.control,
        backgroundColor: colors.white,
      })}
    >
      <Text
        style={[
          type.monoBold,
          { fontSize: 15, color: value === undefined ? colors.textFaint : colors.gunmetal },
        ]}
      >
        {value === undefined ? `${sideLabel("L")}/${sideLabel("R")}` : sideLabel(value)}
      </Text>
    </Pressable>
  );
}
