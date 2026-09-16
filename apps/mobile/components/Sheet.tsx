import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import React from "react";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius } from "@sendtally/design/tokens";

export type SheetProps = {
  visible: boolean;
  onClose: () => void;
  closeLabel: string;
  children: React.ReactNode;
};

/**
 * A bottom sheet sized to its content, dismissed by a drag down, a tap on the scrim or the
 * hardware back button. It rides the keyboard so a focused field stays above the keys; text
 * fields inside it should be `BottomSheetTextInput` for that to hold across focus changes.
 */
export function Sheet({ visible, onClose, closeLabel, children }: SheetProps): React.ReactElement {
  const ref = React.useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  React.useEffect(() => {
    if (visible) ref.current?.present();
    else ref.current?.dismiss();
  }, [visible]);

  const renderBackdrop = React.useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.45}
        style={[props.style, { backgroundColor: colors.gunmetal }]}
        accessibilityLabel={closeLabel}
      />
    ),
    [closeLabel]
  );

  return (
    <BottomSheetModal
      ref={ref}
      onDismiss={onClose}
      enableDynamicSizing
      maxDynamicContentSize={windowHeight - insets.top - 24}
      backdropComponent={renderBackdrop}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backgroundStyle={{ borderRadius: radius.panel, backgroundColor: colors.white }}
      handleIndicatorStyle={{ width: 36, height: 4, backgroundColor: "rgba(64,63,76,0.2)" }}
    >
      <BottomSheetScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        {children}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}
