import React from "react";
import { Pressable, Text, View } from "react-native";
import type { PurchasesPackage } from "react-native-purchases";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { planCardOf } from "./store";

export type PlanPickerProps = {
  packages: PurchasesPackage[];
  selected: PurchasesPackage | null;
  disabled: boolean;
  onSelect: (pkg: PurchasesPackage) => void;
};

const GOLD_TINT = "rgba(249,220,92,0.22)";

export function PlanPicker({
  packages,
  selected,
  disabled,
  onSelect,
}: PlanPickerProps): React.ReactElement {
  return (
    <View style={{ flexDirection: "row", gap: 10 }}>
      {packages.map((pkg) => {
        const card = planCardOf(pkg);
        const active = selected?.identifier === pkg.identifier;
        return (
          <Pressable
            key={card.id}
            onPress={() => onSelect(pkg)}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityState={{ selected: active, disabled }}
            accessibilityLabel={`${card.name}, ${card.price} ${card.cadence}`}
            style={{
              flex: 1,
              borderWidth: 1.5,
              borderColor: active ? colors.gold : colors.lineOnLightStrong,
              backgroundColor: active ? GOLD_TINT : colors.white,
              borderRadius: radius.card,
              padding: 14,
              gap: 4,
              opacity: disabled ? 0.6 : 1,
            }}
          >
            <View style={{ minHeight: 16, alignItems: "flex-start" }}>
              {card.bestValue && (
                <View
                  style={{
                    backgroundColor: colors.gold,
                    borderRadius: radius.sm,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: fonts.monoSemiBold,
                      fontSize: 9,
                      letterSpacing: 0.6,
                      color: colors.gunmetal,
                    }}
                  >
                    BEST VALUE
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={{
                fontFamily: fonts.monoMedium,
                fontSize: 10,
                letterSpacing: 0.8,
                color: colors.watermelonInk,
                paddingTop: 4,
              }}
            >
              {card.name.toUpperCase()}
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{
                fontFamily: fonts.display,
                fontSize: 26,
                lineHeight: 30,
                letterSpacing: -0.6,
                color: colors.gunmetal,
                paddingTop: 2,
              }}
            >
              {card.price}
            </Text>
            <Text
              style={{
                fontFamily: fonts.monoMedium,
                fontSize: 10,
                letterSpacing: 0.6,
                color: colors.textMuted,
              }}
            >
              {card.cadence.toUpperCase()}
            </Text>
            {card.equivalent !== null && (
              <Text
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 12,
                  lineHeight: 17,
                  color: colors.textSecondary,
                }}
              >
                {card.equivalent}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
