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
 */
export function Sheet({ visible, onClose, closeLabel, children }: SheetProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [mounted, setMounted] = React.useState(visible);
  const progress = React.useRef(new Animated.Value(0)).current;
  const keyboard = React.useRef(new Animated.Value(0)).current;
  const [panelHeight, setPanelHeight] = React.useState(0);

  React.useEffect(() => {
    if (visible) setMounted(true);
    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? OPEN_MS : CLOSE_MS,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
    return () => animation.stop();
  }, [visible, progress]);

  // Android's Modal window already shrinks around the keyboard (SOFT_INPUT_ADJUST_RESIZE).
  React.useEffect(() => {
    if (!mounted || Platform.OS !== "ios") return;
    const follow = (event: KeyboardEvent, height: number): void => {
      Animated.timing(keyboard, {
        toValue: height,
        duration: event.duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    };
    const show = Keyboard.addListener("keyboardWillShow", (event) =>
      follow(event, event.endCoordinates.height)
    );
    const hide = Keyboard.addListener("keyboardWillHide", (event) => follow(event, 0));
    return () => {
      show.remove();
      hide.remove();
      keyboard.setValue(0);
    };
  }, [mounted, keyboard]);

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
          onLayout={(event) => setPanelHeight(event.nativeEvent.layout.height)}
          style={{
            maxHeight: windowHeight - insets.top - 24,
            transform: [
              {
                translateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [panelHeight === 0 ? windowHeight : panelHeight, 0],
                }),
              },
            ],
            paddingBottom,
            borderTopLeftRadius: radius.panel,
            borderTopRightRadius: radius.panel,
            backgroundColor: colors.white,
          }}
        >
          <ScrollView bounces={false} keyboardShouldPersistTaps="handled" style={{ flexGrow: 0 }}>
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
