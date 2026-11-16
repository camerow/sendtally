import React from "react";
import { ScrollView, Text, View, useWindowDimensions } from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { t } from "@sendtally/features/i18n";
import { colors, fonts } from "@sendtally/design/tokens";
import { SlideArt } from "./SlideArt";
import { onboardingSlides, type OnboardingSlide } from "./slides";

const PAGE_PADDING = 22;

/**
 * Both blocks are sized to their tallest slide so every slide's column is the same height. A
 * centered column of varying height would slide the headline up and down as you page through.
 */
const ART_BOX_HEIGHT = 310;
const TEXT_BOX_HEIGHT = 170;
const ART_TEXT_GAP = 24;

/**
 * The art box's height and the art's scale on a page this tall: the full 310 where it fits, else
 * what is left over the text box, with the art scaled down whole, so every slide stays alike.
 */
export function artFit(pageHeight: number | null): { height: number; scale: number } {
  if (pageHeight === null) return { height: ART_BOX_HEIGHT, scale: 1 };
  const height = Math.min(ART_BOX_HEIGHT, pageHeight - TEXT_BOX_HEIGHT - ART_TEXT_GAP);
  return { height, scale: height / ART_BOX_HEIGHT };
}

function Dots({ count, active }: { count: number; active: number }): React.ReactElement {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={t("onboarding.featureOf", { n: active + 1, total: count })}
      style={{ flexDirection: "row", gap: 7, justifyContent: "center" }}
    >
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={{
            width: i === active ? 20 : 7,
            height: 7,
            borderRadius: 4,
            backgroundColor: i === active ? colors.gunmetal : colors.dataBarEmpty,
          }}
        />
      ))}
    </View>
  );
}

export type OnboardingCarouselProps = {
  slides?: OnboardingSlide[];
  pageWidth?: number;
  /** False sizes the carousel to its slides, for placing it inside a scrolling page. */
  fill?: boolean;
};

export function OnboardingCarousel({
  slides: given,
  pageWidth,
  fill = true,
}: OnboardingCarouselProps = {}): React.ReactElement {
  const slides = given ?? onboardingSlides();
  const window = useWindowDimensions();
  const width = pageWidth ?? window.width;
  const [active, setActive] = React.useState(0);
  const [pageHeight, setPageHeight] = React.useState<number | null>(null);
  const art = artFit(fill ? pageHeight : null);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>): void {
    const next = Math.round(e.nativeEvent.contentOffset.x / Math.max(1, width));
    setActive((current) => (next === current ? current : next));
  }

  return (
    <View style={{ flex: fill ? 1 : undefined, gap: 20 }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flex: fill ? 1 : undefined }}
        onLayout={(e) => setPageHeight(e.nativeEvent.layout.height)}
      >
        {slides.map((slide, i) => (
          <View
            key={slide.key}
            style={{
              width,
              paddingHorizontal: PAGE_PADDING,
              justifyContent: "center",
              gap: ART_TEXT_GAP,
            }}
          >
            <View style={{ height: art.height, justifyContent: "flex-end" }}>
              <View
                style={{
                  height: ART_BOX_HEIGHT,
                  justifyContent: "flex-end",
                  transform: [{ scale: art.scale }],
                  transformOrigin: "bottom",
                }}
              >
                <SlideArt slide={slide.key} show={i === active} />
              </View>
            </View>
            <View style={{ gap: 10, minHeight: TEXT_BOX_HEIGHT }}>
              <Text
                style={{
                  fontFamily: fonts.monoMedium,
                  fontSize: 11,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: colors.gunmetal,
                }}
              >
                {slide.eyebrow}
              </Text>
              <Text
                style={{
                  fontFamily: fonts.display,
                  fontSize: 27,
                  lineHeight: 31,
                  letterSpacing: -0.8,
                  color: colors.gunmetal,
                }}
              >
                {slide.title}
              </Text>
              <Text
                style={{
                  fontFamily: fonts.sans,
                  fontSize: 15,
                  lineHeight: 23,
                  color: colors.textSecondary,
                }}
              >
                {slide.body}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <Dots count={slides.length} active={active} />
    </View>
  );
}
