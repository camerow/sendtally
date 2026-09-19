import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";
import { CIRCUIT_HEX } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import type { TrendScaleGymVM } from "@sendtally/features/trends";
import { Sheet } from "../../components/Sheet";
import { pressRow } from "../../lib/press";

export function ScaleGymSheet({
  visible,
  gyms,
  selected,
  onPick,
  onClose,
}: {
  visible: boolean;
  gyms: TrendScaleGymVM[];
  selected: string | null;
  onPick: (gymId: string) => void;
  onClose: () => void;
}): React.ReactElement {
  return (
    <Sheet visible={visible} onClose={onClose} closeLabel={t("trends.closeFilter")}>
      <View style={{ gap: 8, paddingHorizontal: 18, paddingBottom: 18 }}>
        <Text
          style={{
            fontFamily: fonts.display,
            fontSize: 22,
            letterSpacing: -0.4,
            color: colors.gunmetal,
          }}
        >
          {t("trends.gymGrades")}
        </Text>
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 13,
            lineHeight: 19,
            color: colors.textSecondary,
          }}
        >
          {t("trends.gymGradesBody")}
        </Text>
        {gyms.map((g) => (
          <Pressable
            key={g.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected === g.id }}
            onPress={() => onPick(g.id)}
            style={pressRow({
              gap: 8,
              paddingVertical: 12,
              paddingHorizontal: 8,
              borderRadius: 8,
              backgroundColor: selected === g.id ? "rgba(49,133,252,0.08)" : "transparent",
            })}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text
                style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.gunmetal }}
              >
                {g.name}
              </Text>
              <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textSecondary }}>
                {t("sessions.sessionCount", { count: g.sessions })}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 4 }}>
              {g.ladder.map((c) => (
                <View key={c.id} style={{ flex: 1, gap: 4 }}>
                  <View
                    style={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: CIRCUIT_HEX[c.colour],
                      borderWidth: 1,
                      borderColor: "rgba(64,63,76,0.18)",
                    }}
                  />
                  <Text
                    numberOfLines={1}
                    style={{ fontFamily: fonts.mono, fontSize: 9, color: colors.textSecondary }}
                  >
                    {c.range}
                  </Text>
                </View>
              ))}
            </View>
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}
