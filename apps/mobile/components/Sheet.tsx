/* eslint-disable react-hooks/refs, react-hooks/set-state-in-effect --
   `progress` and `keyboard` are Animated.Values: animation handles the rules read as render
   state, and reading `.current` during render is how Animated is wired up. The effects drive
   mount/unmount around the animation and mirror keyboard events, which is external-system work. */
import React from "react";
import {
  Animated,
  Easing,
  Keyboard,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type KeyboardEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius } from "@sendtally/design/tokens";

const SCRIM = "rgba(64,63,76,0.45)";
const OPEN_MS = 260;
const CLOSE_MS = 180;
const DISMISS_DISTANCE = 80;
const DISMISS_VELOCITY = 0.6;

export type SheetProps = {
  visible: boolean;
  onClose: () => void;
  closeLabel: string;
  children: React.ReactNode;
};

/**
 * The scrim fades over the whole screen while the panel slides up behind it. Modal's own
 * animationType="slide" moves both as one block, which reads as a solid edge wiping up the screen.
 *
 * The panel also rides the keyboard itself: KeyboardAvoidingView measures nothing useful inside a
 * Modal, so a focused field would otherwise vanish behind the keys. Everything animates on the JS
 * driver because the keyboard inset is padding, which the native driver cannot animate.
 *
 * A downward drag anywhere on the panel (once its content is scrolled to the top) follows the
 * finger and dismisses past a distance or a flick; anything shorter springs back.
 */
export function Sheet({ visible, onClose, closeLabel, children }: SheetProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [mounted, setMounted] = React.useState(visible);
  const progress = React.useRef(new Animated.Value(0)).current;
  const keyboard = React.useRef(new Animated.Value(0)).current;
  const drag = React.useRef(new Animated.Value(0)).current;
  const scrolledToTop = React.useRef(true);
  const closeRef = React.useRef(onClose);
  closeRef.current = onClose;
  const [panelHeight, setPanelHeight] = React.useState(0);
  const [contentHeight, setContentHeight] = React.useState(0);
  const [viewportHeight, setViewportHeight] = React.useState(0);
  const scrollable = contentHeight > viewportHeight + 1;

  const pan = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        scrolledToTop.current && gesture.dy > 8 && gesture.dy > Math.abs(gesture.dx) * 1.5,
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        scrolledToTop.current && gesture.dy > 8 && gesture.dy > Math.abs(gesture.dx) * 1.5,
      onPanResponderMove: (_, gesture) => drag.setValue(Math.max(0, gesture.dy)),
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > DISMISS_DISTANCE || gesture.vy > DISMISS_VELOCITY) {
          Keyboard.dismiss();
          closeRef.current();
          return;
        }
        Animated.spring(drag, { toValue: 0, useNativeDriver: false, bounciness: 4 }).start();
      },
      onPanResponderTerminate: () =>
        Animated.spring(drag, { toValue: 0, useNativeDriver: false, bounciness: 4 }).start(),
    })
  ).current;

  React.useEffect(() => {
    if (visible) setMounted(true);
    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? OPEN_MS : CLOSE_MS,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start(({ finished }) => {
      if (finished && !visible) {
        setMounted(false);
        drag.setValue(0);
      }
    });
    return () => animation.stop();
  }, [visible, progress, drag]);

  // Android only has the "did" events, reports the keyboard height minus the navigation bar,
  // and with edge-to-edge (target SDK 35) its Modal window no longer shrinks around the
  // keyboard, so both platforms follow it here.
  React.useEffect(() => {
    if (!mounted) return;
    const ios = Platform.OS === "ios";
    const follow = (event: KeyboardEvent, height: number): void => {
      Animated.timing(keyboard, {
        toValue: height,
        duration: event.duration || 160,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    };
    const show = Keyboard.addListener(ios ? "keyboardWillShow" : "keyboardDidShow", (event) =>
      follow(event, event.endCoordinates.height + (ios ? 0 : insets.bottom))
    );
    const hide = Keyboard.addListener(ios ? "keyboardWillHide" : "keyboardDidHide", (event) =>
      follow(event, 0)
    );
    return () => {
      show.remove();
      hide.remove();
      keyboard.setValue(0);
    };
  }, [mounted, keyboard, insets.bottom]);

  const bottomInset = Math.max(insets.bottom, 16);
  // The keyboard covers the home indicator, so its inset gives way to a plain 16 above the keys.
  const paddingBottom = keyboard.interpolate({
    inputRange: [0, Math.max(insets.bottom, 1), windowHeight],
    outputRange: [bottomInset, bottomInset, windowHeight - insets.bottom + bottomInset],
  });

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: progress }]}>
          <Pressable
            onPress={onClose}
            accessibilityLabel={closeLabel}
            style={{ flex: 1, backgroundColor: SCRIM }}
          />
        </Animated.View>
        <Animated.View
          {...pan.panHandlers}
          onLayout={(event) => setPanelHeight(event.nativeEvent.layout.height)}
          style={{
            maxHeight: windowHeight - insets.top - 24,
            transform: [
              {
                translateY: Animated.add(
                  progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [panelHeight === 0 ? windowHeight : panelHeight, 0],
                  }),
                  drag
                ),
              },
            ],
            paddingBottom,
            borderTopLeftRadius: radius.panel,
            borderTopRightRadius: radius.panel,
            backgroundColor: colors.white,
          }}
        >
          <View
            style={{
              alignSelf: "center",
              width: 36,
              height: 4,
              marginTop: 10,
              borderRadius: 2,
              backgroundColor: "rgba(64,63,76,0.2)",
            }}
          />
          <ScrollView
            bounces={false}
            scrollEnabled={scrollable}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
            onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}
            onContentSizeChange={(_, height) => setContentHeight(height)}
            onScroll={(event) => {
              scrolledToTop.current = event.nativeEvent.contentOffset.y <= 0;
            }}
            style={{ flexGrow: 0 }}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
