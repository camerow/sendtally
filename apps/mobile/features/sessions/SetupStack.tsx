import React from "react";
import { Pressable, Text, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { press } from "../../lib/press";
import { bodyText, monoMuted, sectionLabel } from "../../lib/styles";

export type SetupCard = {
  key: string;
  eyebrow: string;
  title: string;
  body: string;
  action: string;
  busy?: boolean;
  error?: string | null;
  onAction: () => void;
  onDismiss: () => void;
};

/** One card per thing not set up yet, gym first. Any new step is one more entry in the list. */
export function SetupStack({
  cards,
  total,
}: {
  cards: SetupCard[];
  total: number;
}): React.ReactElement | null {
  if (cards.length === 0) return null;
  return (
    <View style={{ marginHorizontal: 18, marginTop: 8, marginBottom: 6, gap: 8 }}>
      <Text style={sectionLabel}>
        {t("gyms.setupProgress", { done: total - cards.length, total })}
      </Text>
      {cards.map((card) => (
        <View
          key={card.key}
          style={{
            padding: 16,
            gap: 6,
            backgroundColor: colors.white,
            borderWidth: 1,
            borderColor: colors.lineOnLight,
            borderRadius: radius.card,
          }}
        >
          <Text style={monoMuted}>{card.eyebrow}</Text>
          <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.gunmetal }}>
            {card.title}
          </Text>
          <Text style={bodyText}>{card.body}</Text>
          <View style={{ gap: 10, marginTop: 6 }}>
            <Pressable
              onPress={card.onAction}
              disabled={card.busy === true}
              accessibilityRole="button"
              style={press({
                minHeight: 44,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: radius.control,
                borderWidth: 1,
                borderColor: colors.lineOnLightStrong,
                opacity: card.busy === true ? 0.55 : 1,
              })}
            >
              <Text
                style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.gunmetal }}
              >
                {card.action}
              </Text>
            </Pressable>
            <Pressable
              onPress={card.onDismiss}
              accessibilityRole="button"
              hitSlop={8}
              style={press({ minHeight: 44, alignItems: "center", justifyContent: "center" })}
            >
              <Text
                style={{
                  fontFamily: fonts.mono,
                  fontSize: 11,
                  color: colors.textMuted,
                  textDecorationLine: "underline",
                }}
              >
                {t("sessions.notNow")}
              </Text>
            </Pressable>
          </View>
          {card.error != null && (
            <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textSecondary }}>
              {card.error}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}
