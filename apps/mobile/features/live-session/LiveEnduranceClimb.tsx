import React from "react";
import { Pressable, Text, View } from "react-native";
import {
  enduranceAmountLabel,
  enduranceLapCountLabel,
  enduranceLapValueLabel,
  enduranceOf,
  enduranceTotals,
  isCleanLap,
  type ClimbDraft,
} from "@sendtally/features/log-session";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { Icon } from "../../components/Icon";
import { press, pressRow } from "../../lib/press";

export type LiveEnduranceClimbProps = {
  climb: ClimbDraft;
  onPress: () => void;
  onAddLap: () => void;
};

/**
 * The circuit being worked right now: one lap square each, and one button for the lap just
 * finished. Coming off partway is rare enough to belong in the editor, not on this card.
 */
export function LiveEnduranceClimb({
  climb,
  onPress,
  onAddLap,
}: LiveEnduranceClimbProps): React.ReactElement {
  const endurance = enduranceOf(climb);
  const { done, laps } = enduranceTotals(endurance);
  const named = climb.name.trim() !== "";
  const title = named ? climb.name : t("endurance.title");

  return (
    <View
      style={{
        gap: 12,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.lineOnLightSoft,
      }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${enduranceLapCountLabel(laps)}`}
        style={pressRow({ flexDirection: "row", alignItems: "center", gap: 10 })}
      >
        <Icon name="endurance" color={colors.petalInk} size={16} strokeWidth={2.4} />
        <Text
          numberOfLines={1}
          style={{
            flex: 1,
            fontFamily: named ? fonts.sansSemiBold : fonts.sans,
            fontSize: 16,
            color: named ? colors.gunmetal : colors.textMuted,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontFamily: fonts.monoMedium,
            fontSize: 11,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            color: colors.textMuted,
          }}
        >
          {`${enduranceAmountLabel(endurance, endurance.target)} · ${climb.grade}`}
        </Text>
      </Pressable>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
        {endurance.laps.map((_, i) => {
          const clean = isCleanLap(endurance, i);
          return (
            <View
              key={i}
              style={{
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                borderWidth: 1,
                borderColor: clean ? colors.fern : colors.watermelonInk,
                backgroundColor: colors.white,
              }}
            >
              {clean ? (
                <Icon name="check" color={colors.fern} size={16} strokeWidth={2.6} />
              ) : (
                <Text
                  style={{ fontFamily: fonts.monoSemiBold, fontSize: 10, color: colors.gunmetal }}
                >
                  {enduranceLapValueLabel(endurance, i)}
                </Text>
              )}
            </View>
          );
        })}
        <View
          style={{
            flexGrow: 1,
            minWidth: 120,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: colors.lineOnLightStrong,
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              fontFamily: fonts.monoMedium,
              fontSize: 11,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              color: colors.textMuted,
            }}
          >
            {`${enduranceLapCountLabel(laps)} · ${enduranceAmountLabel(endurance, done)}`}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onAddLap}
        accessibilityRole="button"
        style={press({
          minHeight: 52,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: radius.control,
          backgroundColor: colors.gunmetal,
        })}
      >
        <Text
          style={{
            fontFamily: fonts.monoSemiBold,
            fontSize: 13,
            letterSpacing: 0.9,
            textTransform: "uppercase",
            color: colors.white,
          }}
        >
          {`+ ${t("endurance.lapDone")}`}
        </Text>
      </Pressable>
    </View>
  );
}
