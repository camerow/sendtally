import { useIsFocused } from "expo-router/react-navigation";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Animated, KeyboardAvoidingView, Platform, useWindowDimensions, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import type { LibraryPicture } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { BackButton } from "./BackButton";
import { DetailHero } from "./DetailHero";
import { FloatingBar } from "./FloatingBar";
import { KeypadScrollView } from "./KeypadScrollView";
import { ToastFooter } from "./Toast";

/** How far the page's card overlaps the hero, and the radius of its top corners. */
const OVERLAP = 30;

/**
 * The hero at the top of a detail screen: still while the page's card slides up over it, its bar
 * floating on white until the card reaches the top and today's bar comes back.
 */
function HeroScroll({
  pictures,
  children,
  covered,
  onCovered,
}: {
  pictures: readonly LibraryPicture[];
  children: React.ReactNode;
  covered: boolean;
  onCovered: (covered: boolean) => void;
}): React.ReactElement {
  const { width } = useWindowDimensions();
  const { top } = useSafeAreaInsets();
  const height = Math.round((width * 3) / 4) + top;
  const [scrollY] = React.useState(() => new Animated.Value(0));
  return (
    <Animated.ScrollView
      bounces={false}
      scrollEventThrottle={16}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ flexGrow: 1 }}
      onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
        listener: (e: { nativeEvent: { contentOffset: { y: number } } }) => {
          const now = e.nativeEvent.contentOffset.y >= height - OVERLAP - top - BAR_HEIGHT;
          if (now !== covered) onCovered(now);
        },
      })}
    >
      <Animated.View style={{ height, transform: [{ translateY: scrollY }] }}>
        <DetailHero pictures={pictures} width={width} height={height} overlap={OVERLAP} shade />
      </Animated.View>
      <View
        style={{
          flexGrow: 1,
          zIndex: 1,
          marginTop: -OVERLAP,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: colors.white,
          gap: 20,
          paddingTop: 22,
          paddingHorizontal: 18,
          paddingBottom: 24,
        }}
      >
        {children}
      </View>
    </Animated.ScrollView>
  );
}

const BAR_HEIGHT = 50;

export type ScreenFrameProps = {
  children?: React.ReactNode;
  /** Beside the back button, top right. */
  action?: React.ReactNode;
  /** Where back goes, when it is worth naming. */
  backLabel?: string;
  /** In place of going back a screen, as a step inside one screen does. */
  onBack?: () => void;
  /** In place of the back button and action, as an editor's Cancel and Save. */
  header?: React.ReactNode;
  /** Pinned under the scrolling body, hidden while the keypad is up. */
  footer?: React.ReactNode;
  /** Over the whole screen, as a toast is, which sits above the footer. */
  overlay?: React.ReactNode;
  /** A built-in's pictures, as a hero behind the top of the page; none keeps the plain frame. */
  hero?: readonly LibraryPicture[];
};

/** A full screen, planning or detail: back, a scrolling body that keeps a field being typed in above the keys, and a footer. */
export function ScreenFrame({
  children,
  action,
  backLabel,
  onBack,
  header,
  footer,
  overlay,
  hero = [],
}: ScreenFrameProps): React.ReactElement {
  const [keypad, setKeypad] = React.useState(false);
  const [footerHeight, setFooterHeight] = React.useState(0);
  const [covered, setCovered] = React.useState(false);
  const { top } = useSafeAreaInsets();
  const focused = useIsFocused();
  const shown = footer !== undefined && !keypad;
  const pictured = hero.length > 0;
  const floating = pictured && !covered;
  return (
    <SafeAreaView
      edges={pictured ? ["bottom"] : ["top", "bottom"]}
      style={{ flex: 1, backgroundColor: colors.white }}
    >
      {pictured && focused && <StatusBar style={floating ? "light" : "dark"} />}
      {header ?? (
        <FloatingBar.Provider value={floating}>
          <View
            style={[
              {
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 18,
                paddingTop: 6,
              },
              pictured && {
                position: "absolute",
                zIndex: 2,
                left: 0,
                right: 0,
                minHeight: top + BAR_HEIGHT,
                paddingTop: top + 6,
                backgroundColor: covered ? colors.white : "transparent",
              },
            ]}
          >
            <BackButton label={backLabel} onPress={onBack} />
            {action}
          </View>
        </FloatingBar.Provider>
      )}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        {pictured ? (
          <HeroScroll pictures={hero} covered={covered} onCovered={setCovered}>
            {children}
          </HeroScroll>
        ) : (
          <KeypadScrollView
            onKeypadChange={setKeypad}
            contentContainerStyle={{
              gap: 20,
              paddingTop: 8,
              paddingHorizontal: 18,
              paddingBottom: 24,
            }}
          >
            {children}
          </KeypadScrollView>
        )}
        {shown && (
          <View
            testID="screen-footer"
            onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
            style={{
              paddingTop: 12,
              paddingHorizontal: 18,
              paddingBottom: 10,
              borderTopWidth: 1,
              borderTopColor: colors.lineOnLight,
            }}
          >
            {footer}
          </View>
        )}
      </KeyboardAvoidingView>
      <ToastFooter.Provider value={shown ? footerHeight : 0}>{overlay}</ToastFooter.Provider>
    </SafeAreaView>
  );
}
