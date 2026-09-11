import React from "react";
import { Animated, Easing, Modal, Pressable, StyleSheet, View } from "react-native";
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
 */
export function Sheet({ visible, onClose, closeLabel, children }: SheetProps): React.ReactElement {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = React.useState(visible);
  const progress = React.useRef(new Animated.Value(0)).current;
  const [panelHeight, setPanelHeight] = React.useState(0);

  React.useEffect(() => {
    if (visible) setMounted(true);
    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? OPEN_MS : CLOSE_MS,
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
    return () => animation.stop();
  }, [visible, progress]);

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
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
            transform: [
              {
                translateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [panelHeight === 0 ? 600 : panelHeight, 0],
                }),
              },
            ],
            paddingBottom: Math.max(insets.bottom, 16),
            borderTopLeftRadius: radius.panel,
            borderTopRightRadius: radius.panel,
            backgroundColor: colors.white,
          }}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}
