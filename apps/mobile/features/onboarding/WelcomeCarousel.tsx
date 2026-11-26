import React from "react";
import { useWindowDimensions, View, type ViewStyle } from "react-native";
import { DEFAULT_WEIGHT_UNIT } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { t } from "@sendtally/features/i18n";
import { useDisplayScales, welcomeCards, type WelcomeCardKey } from "@sendtally/features/settings";
import { FeatureCard } from "../../components/FeatureCard";
import { ProgressSegments } from "../../components/ProgressSegments";
import { SnapCarousel } from "../../components/SnapCarousel";
import { WelcomeArt } from "./WelcomeArt";

const PAD = 22;
const ART_MIN = 184;

const chart: ViewStyle = {
  backgroundColor: colors.white,
  borderBottomWidth: 1,
  borderBottomColor: colors.lineOnLight,
};

const GROUND: Record<WelcomeCardKey, ViewStyle> = {
  blocks: { backgroundColor: colors.gunmetal },
  workouts: { backgroundColor: colors.surfaceSoft },
  hangboard: { backgroundColor: colors.gunmetal },
  metrics: chart,
  load: chart,
  log: chart,
};

/** The six cards of what sendtally does, as tall as the room it is given, with the wizard's segments marking the one in view. */
export function WelcomeCarousel(): React.ReactElement {
  const { width } = useWindowDimensions();
  const scales = useDisplayScales();
  const view = React.useMemo(() => welcomeCards(DEFAULT_WEIGHT_UNIT, scales), [scales]);
  const [shown, setShown] = React.useState(0);
  const cardWidth = width - 76;
  return (
    <View style={{ flexGrow: 1, gap: 12 }}>
      <SnapCarousel
        cardWidth={cardWidth}
        onCard={setShown}
        contentContainerStyle={{ paddingHorizontal: PAD }}
        accessibilityLabel={t("onboarding.intro.cards")}
      >
        {view.cards.map((card) => (
          <FeatureCard
            key={card.key}
            width={cardWidth}
            title={card.title}
            body={card.body}
            large
            accessibilityLabel={card.label}
            art={<WelcomeArt card={card.key} view={view} width={cardWidth - 34} />}
            artStyle={[{ flexGrow: 1, minHeight: ART_MIN, paddingVertical: 12 }, GROUND[card.key]]}
          />
        ))}
      </SnapCarousel>
      <View style={{ paddingHorizontal: PAD }}>
        <ProgressSegments total={view.cards.length} n={shown + 1} />
      </View>
    </View>
  );
}
