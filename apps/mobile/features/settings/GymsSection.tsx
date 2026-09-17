import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import type { Gym } from "@sendtally/features/gyms";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { CircuitDot } from "../../components/CircuitDot";
import { Icon } from "../../components/Icon";
import { press, pressRow } from "../../lib/press";
import { bodyText, sectionCard, sectionLabel } from "../../lib/styles";

export function GymsSection({ gyms }: { gyms: Gym[] }): React.ReactElement {
  return (
    <View style={sectionCard}>
      <Text style={sectionLabel}>{t("gyms.title")}</Text>
      {gyms.length === 0 ? (
        <Text style={bodyText}>{t("gyms.none")}</Text>
      ) : (
        <View>
          {gyms.map((gym) => (
            <Pressable
              key={gym.id}
              onPress={() => router.push({ pathname: "/gym/[id]", params: { id: gym.id } })}
              accessibilityRole="button"
              accessibilityLabel={`${gym.name}, ${t("gyms.circuitCount", { count: gym.circuits.length })}`}
              style={pressRow({
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                minHeight: 52,
                borderBottomWidth: 1,
                borderBottomColor: colors.lineOnLightSoft,
              })}
            >
              <View style={{ flex: 1, gap: 4 }}>
                <Text
                  style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.gunmetal }}
                >
                  {gym.name}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  {gym.circuits.map((c) => (
                    <CircuitDot key={c.id} colour={c.colour} size={10} />
                  ))}
                  <Text
                    style={{
                      marginLeft: 4,
                      fontFamily: fonts.monoMedium,
                      fontSize: 10,
                      letterSpacing: 0.6,
                      textTransform: "uppercase",
                      color: colors.textMuted,
                    }}
                  >
                    {t("gyms.circuitCount", { count: gym.circuits.length })}
                  </Text>
                </View>
              </View>
              <Icon name="chevron" color={colors.textFaint} size={16} />
            </Pressable>
          ))}
        </View>
      )}
      <Pressable
        onPress={() => router.push({ pathname: "/gym/[id]", params: { id: "new" } })}
        accessibilityRole="button"
        style={press({
          minHeight: 44,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          borderRadius: radius.control,
          borderWidth: 1,
          borderColor: colors.lineOnLightStrong,
        })}
      >
        <Icon name="plus" color={colors.gunmetal} size={16} strokeWidth={2.2} />
        <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.gunmetal }}>
          {t("gyms.addGym")}
        </Text>
      </Pressable>
    </View>
  );
}
