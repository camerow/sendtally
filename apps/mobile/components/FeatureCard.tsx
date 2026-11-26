import React from "react";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, fonts, radius } from "@sendtally/design/tokens";

export type FeatureCardProps = {
  width: number;
  title: string;
  body: string;
  /** A picture of the feature, hidden from screen readers and from touch. */
  art: React.ReactNode;
  /** The picture's ground and size. */
  artStyle: StyleProp<ViewStyle>;
  /** Title 18 and body 15, for a card that is the screen's subject. */
  large?: boolean;
  /** Reads the card as one element. */
  accessibilityLabel?: string;
};

/** A white card in a carousel of features: a picture on its own ground, then a title and a line. */
export function FeatureCard({
  width,
  title,
  body,
  art,
  artStyle,
  large = false,
  accessibilityLabel,
}: FeatureCardProps): React.ReactElement {
  return (
    <View
      {...(accessibilityLabel !== undefined && { accessible: true, accessibilityLabel })}
      style={{
        width,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.lineOnLight,
        borderRadius: radius.card,
        overflow: "hidden",
      }}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        style={[{ justifyContent: "center", paddingHorizontal: 16 }, artStyle]}
      >
        {art}
      </View>
      <View style={{ gap: 4, paddingTop: 14, paddingHorizontal: 16, paddingBottom: 16 }}>
        <Text
          style={{
            fontFamily: fonts.sansSemiBold,
            fontSize: large ? 18 : 14,
            ...(large && { lineHeight: 23 }),
            color: colors.gunmetal,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: large ? 15 : 13,
            lineHeight: large ? 22 : 19,
            color: colors.textSecondary,
          }}
        >
          {body}
        </Text>
      </View>
    </View>
  );
}
