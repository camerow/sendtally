import React from "react";
import { ScrollView, Text, View, useWindowDimensions } from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { colors, fonts } from "@sendtally/design/tokens";
import { SlideArt } from "./SlideArt";
import { ONBOARDING_SLIDES } from "./slides";

const PAGE_PADDING = 22;

/**
 * Both blocks are sized to their tallest slide so every slide's column is the same height. A
 * centered column of varying height would slide the headline up and down as you page through.
 */
const ART_BOX_HEIGHT = 250;
const TEXT_BOX_HEIGHT = 200;

function Dots({ count, active }: { count: number; active: number }): React.ReactElement {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Feature ${active + 1} of ${count}`}
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

export function OnboardingCarousel(): React.ReactElement {
  const { width } = useWindowDimensions();
  const [active, setActive] = React.useState(0);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>): void {
    const next = Math.round(e.nativeEvent.contentOffset.x / Math.max(1, width));
    setActive((current) => (next === current ? current : next));
  }

  return (
    <View style={{ flex: 1, gap: 20 }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {ONBOARDING_SLIDES.map((slide) => (
          <View
            key={slide.key}
            style={{
              width,
              paddingHorizontal: PAGE_PADDING,
              justifyContent: "center",
              gap: 24,
            }}
          >
            <View style={{ height: ART_BOX_HEIGHT, justifyContent: "flex-end" }}>
              <SlideArt slide={slide.key} />
            </View>
            <View style={{ gap: 10, minHeight: TEXT_BOX_HEIGHT }}>
              <Text
                style={{
                  fontFamily: fonts.monoMedium,
                  fontSize: 11,
                  letterSpacing: 1,
                  color: colors.watermelonInk,
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
      <Dots count={ONBOARDING_SLIDES.length} active={active} />
    </View>
  );
}
