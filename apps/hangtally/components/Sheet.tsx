import {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
  type BottomSheetFooterProps,
} from "@gorhom/bottom-sheet";
import React from "react";
import { Keyboard, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";

export type SheetProps = {
  visible: boolean;
  onClose: () => void;
  closeLabel: string;
  children: React.ReactNode;
  /** Pinned under the scrolling body, above the home indicator. */
  footer?: React.ReactNode;
};

/**
 * A light sheet over the dark ground, sized to its content, closed by a drag,
 * the dimmed backdrop or the back button. Every open mounts a fresh modal: a
 * modal presented again after a dismiss can come back mounted but closed.
 * Sheets stack, so the grip picker can open over the planner.
 */
export function Sheet({
  visible,
  onClose,
  closeLabel,
  children,
  footer,
}: SheetProps): React.ReactElement | null {
  const c = useTheme();
  const ref = React.useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [generation, setGeneration] = React.useState(0);
  const [wasVisible, setWasVisible] = React.useState(false);
  const [footerHeight, setFooterHeight] = React.useState(0);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setGeneration((g) => g + 1);
  }

  React.useEffect(() => {
    if (visible) {
      Keyboard.dismiss();
      ref.current?.present();
    } else ref.current?.dismiss();
  }, [visible, generation]);

  const renderBackdrop = React.useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={1}
        style={[props.style, { backgroundColor: c.scrim }]}
        accessibilityLabel={closeLabel}
      />
    ),
    [closeLabel, c.scrim]
  );

  const bottomPad = Math.max(insets.bottom, 16);
  const renderFooter = React.useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props}>
        <View
          onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
          style={{
            backgroundColor: c.card,
            borderTopWidth: 1,
            borderTopColor: c.lineLight,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: bottomPad,
          }}
        >
          {footer}
        </View>
      </BottomSheetFooter>
    ),
    [footer, c.card, c.lineLight, bottomPad]
  );

  if (generation === 0) return null;
  return (
    <BottomSheetModal
      key={generation}
      ref={ref}
      onDismiss={onClose}
      stackBehavior="push"
      accessible={false}
      enableDynamicSizing
      topInset={insets.top + 24}
      maxDynamicContentSize={windowHeight - insets.top - 24}
      backdropComponent={renderBackdrop}
      footerComponent={footer === undefined ? undefined : renderFooter}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      backgroundStyle={{ borderRadius: 26, backgroundColor: c.card }}
      handleIndicatorStyle={{ width: 44, height: 5, backgroundColor: c.lineLight }}
    >
      <BottomSheetScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 4,
          paddingBottom: footer === undefined ? bottomPad + 14 : footerHeight + 20,
        }}
      >
        {children}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}
