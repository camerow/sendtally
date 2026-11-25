import React from "react";
import { ScrollView, Text, useWindowDimensions, View } from "react-native";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import type { MembersGet as MembersGetView } from "@sendtally/features/billing";
import { t } from "@sendtally/features/i18n";
import { ART_HEIGHT } from "../../components/SetupStack";
import { LoadBars } from "../first-run/plan/components/LoadBars";
import { YoursTag } from "../first-run/plan/components/YoursTag";
import { Button } from "../training/components/Button";
import { RestPreview } from "../training/rest/RestPreview";
import { Title } from "../training/components/Title";
import { type } from "../training/type";

function SampleWorkout({ view }: { view: MembersGetView }): React.ReactElement {
  const [first, second] = view.exercises;
  const head = (e: MembersGetView["exercises"][number]): React.ReactElement => (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text
          numberOfLines={1}
          style={[
            type.bodyBold,
            { flexShrink: 1, fontSize: 15, lineHeight: 19, color: colors.gunmetal },
          ]}
        >
          {e.name}
        </Text>
        {e.yours && <YoursTag />}
      </View>
      <Text
        numberOfLines={1}
        style={[type.monoBold, { fontSize: 13, lineHeight: 17, color: colors.gunmetal }]}
      >
        {e.work}
      </Text>
    </View>
  );
  return (
    <>
      {head(first)}
      <RestPreview seconds={view.restS} />
      {head(second)}
    </>
  );
}

export function MembersGet({
  view,
  onBecomeMember,
}: {
  view: MembersGetView;
  onBecomeMember?: () => void;
}): React.ReactElement {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 76, 360);
  const art = {
    blocks: { background: colors.gunmetal, content: <LoadBars bars={view.bars} height={44} /> },
    workouts: { background: colors.surfaceSoft, content: <SampleWorkout view={view} /> },
  };
  return (
    <View
      style={{
        backgroundColor: colors.surfaceSoft,
        borderRadius: radius.panel,
        paddingVertical: 14,
        paddingHorizontal: 18,
        gap: 10,
        overflow: "hidden",
      }}
    >
      <View style={{ gap: 6 }}>
        <Title size={26}>{view.heading}</Title>
        <Text
          style={{
            fontFamily: fonts.sans,
            fontSize: 13,
            lineHeight: 19,
            color: colors.textSecondary,
          }}
        >
          {view.line}
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + 8}
        decelerationRate="fast"
        style={{ marginRight: -18 }}
        contentContainerStyle={{ gap: 8, paddingRight: 18 }}
      >
        {view.cards.map((card) => (
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
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{
                height: ART_HEIGHT,
                justifyContent: "center",
                paddingHorizontal: 16,
                backgroundColor: art[card.key].background,
              }}
            >
              {art[card.key].content}
            </View>
            <View style={{ gap: 4, paddingTop: 14, paddingHorizontal: 16, paddingBottom: 16 }}>
              <Text
                style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.gunmetal }}
              >
                {card.title}
              </Text>
              <Text
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 13,
                  lineHeight: 19,
                  color: colors.textSecondary,
                }}
              >
                {card.body}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
      {onBecomeMember !== undefined && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingTop: 14,
            borderTopWidth: 1,
            borderTopColor: colors.dataBarEmpty,
          }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text
              style={{
                fontFamily: fonts.sansSemiBold,
                fontSize: 16,
                lineHeight: 21,
                color: colors.gunmetal,
              }}
            >
              {t("billing.supportTitle")}
            </Text>
            <Text
              style={{
                fontFamily: fonts.sans,
                fontSize: 13,
                lineHeight: 18,
                color: colors.textSecondary,
              }}
            >
              {t("billing.supportBody")}
            </Text>
          </View>
          <Button
            variant="primary"
            height={44}
            label={t("billing.becomeAMember")}
            onPress={onBecomeMember}
          />
        </View>
      )}
    </View>
  );
}
