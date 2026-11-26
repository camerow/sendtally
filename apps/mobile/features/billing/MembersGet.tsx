import React from "react";
import { Text, useWindowDimensions, View } from "react-native";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import type { MembersGet as MembersGetView } from "@sendtally/features/billing";
import { t } from "@sendtally/features/i18n";
import { FeatureCard } from "../../components/FeatureCard";
import { ART_HEIGHT } from "../../components/SetupStack";
import { SnapCarousel } from "../../components/SnapCarousel";
import { LoadBars } from "../first-run/plan/components/LoadBars";
import { Button } from "../training/components/Button";
import { Title } from "../training/components/Title";
import { SampleWorkout } from "./SampleWorkout";

export function MembersGet({
  view,
  onBecomeMember,
}: {
  view: MembersGetView;
  onBecomeMember?: () => void;
}): React.ReactElement {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 102, 300);
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
      <SnapCarousel
        cardWidth={cardWidth}
        style={{ marginRight: -18 }}
        contentContainerStyle={{ paddingRight: 18 }}
      >
        {view.cards.map((card) => (
          <FeatureCard
            key={card.key}
            width={cardWidth}
            title={card.title}
            body={card.body}
            art={art[card.key].content}
            artStyle={{ minHeight: ART_HEIGHT, backgroundColor: art[card.key].background }}
          />
        ))}
      </SnapCarousel>
      {onBecomeMember !== undefined && (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 10,
            paddingTop: 14,
            borderTopWidth: 1,
            borderTopColor: colors.dataBarEmpty,
          }}
        >
          <View style={{ flexGrow: 1, flexBasis: 120, gap: 2 }}>
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
