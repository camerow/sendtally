import React from "react";
import {
  ScrollView,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const GAP = 8;

export type SnapCarouselProps = {
  cardWidth: number;
  children: React.ReactNode;
  /** The card that has snapped to the start, as the row scrolls. */
  onCard?: (index: number) => void;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/** A row of cards that snaps a card at a time, the next one showing at the edge. */
export function SnapCarousel({
  cardWidth,
  children,
  onCard,
  style,
  contentContainerStyle,
  accessibilityLabel,
}: SnapCarouselProps): React.ReactElement {
  const last = React.Children.count(children) - 1;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={cardWidth + GAP}
      decelerationRate="fast"
      style={style}
      contentContainerStyle={[{ gap: GAP }, contentContainerStyle]}
      {...(accessibilityLabel !== undefined && { accessibilityLabel })}
      {...(onCard !== undefined && {
        scrollEventThrottle: 16,
        onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) =>
          onCard(
            Math.min(
              last,
              Math.max(0, Math.round(e.nativeEvent.contentOffset.x / (cardWidth + GAP)))
            )
          ),
      })}
    >
      {children}
    </ScrollView>
  );
}
