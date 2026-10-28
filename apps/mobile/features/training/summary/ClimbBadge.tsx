import React from "react";
import { Text, View } from "react-native";
import type { SetClimb } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { CIRCUIT_COLOURS, CIRCUIT_HEX } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import { type } from "../type";

/** One climb of a set: its grade, or its circuit's colour, dashed when it did not go. */
export function ClimbBadge({ climb }: { climb: SetClimb }): React.ReactElement {
  const colour = CIRCUIT_COLOURS.find((c) => c === climb.circuit?.colour);
  return (
    <View
      accessibilityLabel={[
        climb.circuit?.label ?? climb.grade,
        climb.sent ? t("common.sent") : t("sessionDetail.notYet"),
      ].join(", ")}
      style={{
        minWidth: 30,
        height: 28,
        paddingHorizontal: 7,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        ...(climb.sent
          ? { backgroundColor: colors.surfaceSoft }
          : { borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.lineOnLightStrong }),
      }}
    >
      {colour === undefined ? (
        <Text
          style={[
            type.monoBold,
            { fontSize: 12.5, color: climb.sent ? colors.gunmetal : colors.textSecondary },
          ]}
        >
          {climb.grade}
        </Text>
      ) : (
        <View
          style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: CIRCUIT_HEX[colour] }}
        />
      )}
    </View>
  );
}
