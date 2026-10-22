import React from "react";
import { Pressable, Text, View } from "react-native";
import type { ActivityKind } from "@sendtally/api-client";
import { colors } from "@sendtally/design/tokens";
import { ACTIVITY_KINDS, kindLabel } from "@sendtally/features/activities";
import { press } from "../../../lib/press";
import { activityColor } from "../statistics/kindColors";
import { type } from "../type";

export type KindChipsProps = { value: ActivityKind; onChange: (kind: ActivityKind) => void };

/** One chip per kind, each with the mark it wears in the statistics. */
export function KindChips({ value, onChange }: KindChipsProps): React.ReactElement {
  return (
    <View accessibilityRole="radiogroup" style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {ACTIVITY_KINDS.map((kind) => {
        const on = kind === value;
        return (
          <Pressable
            key={kind}
            onPress={() => onChange(kind)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            style={press({
              height: 44,
              paddingHorizontal: 14,
              borderRadius: 22,
              flexDirection: "row",
              alignItems: "center",
              gap: 7,
              ...(on
                ? { backgroundColor: colors.gunmetal }
                : { borderWidth: 1, borderColor: colors.lineOnLightStrong }),
            })}
          >
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                backgroundColor: activityColor(kind),
                ...(on && { borderWidth: 1.5, borderColor: colors.white }),
              }}
            />
            <Text
              style={[
                type.body,
                { fontSize: 14, color: on ? colors.white : colors.gunmetal },
                on && type.bodyBold,
              ]}
            >
              {kindLabel(kind)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
