import React from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { t } from "@sendtally/features/i18n";
import { colors, disabledOpacity, fonts, radius } from "@sendtally/design/tokens";
import { press } from "../lib/press";
import { bodyText, sectionLabel } from "../lib/styles";

export const ART_HEIGHT = 104;

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
  /** A picture of what the card gives, drawn above its text on its own ground. */
  art?: { background: string; content: React.ReactNode };
};

/** One card per thing not set up yet. Any new step is one more entry in the list. */
export function SetupStack({
  cards,
  total,
}: {
  cards: SetupCard[];
  total: number;
}): React.ReactElement | null {
  const { width } = useWindowDimensions();
  if (cards.length === 0) return null;
  const cardWidth = cards.length === 1 ? width - 36 : Math.min(width - 56, 360);
  return (
    <View style={{ marginTop: 8, marginBottom: 6, gap: 8 }}>
      <Text style={{ ...sectionLabel, marginHorizontal: 18 }}>
        {t("gyms.setupProgress", { done: total - cards.length, total })}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + 8}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 18, gap: 8 }}
      >
        {cards.map((card) => (
          <View
            key={card.key}
            style={{
              width: cardWidth,
              backgroundColor: colors.white,
              borderWidth: 1,
              borderColor: colors.lineOnLight,
              borderRadius: radius.card,
              overflow: "hidden",
            }}
          >
            {card.art !== undefined && (
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={{
                  height: ART_HEIGHT,
                  justifyContent: "center",
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  backgroundColor: card.art.background,
                }}
              >
                {card.art.content}
              </View>
            )}
            <View style={{ flex: 1, justifyContent: "space-between", padding: 16, gap: 6 }}>
              <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textMuted }}>
                {card.eyebrow}
              </Text>
              <Text
                style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.gunmetal }}
              >
                {card.title}
              </Text>
              <Text style={bodyText}>{card.body}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginTop: 6 }}>
                <Pressable
                  onPress={card.onAction}
                  disabled={card.busy === true}
                  accessibilityRole="button"
                  style={press({
                    flex: 1,
                    minHeight: 44,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: radius.control,
                    borderWidth: 1,
                    borderColor: colors.lineOnLightStrong,
                    opacity: card.busy === true ? disabledOpacity : 1,
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
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
