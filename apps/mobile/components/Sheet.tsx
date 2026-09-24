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
import { colors, radius } from "@sendtally/design/tokens";

export type SheetProps = {
  visible: boolean;
  onClose: () => void;
  closeLabel: string;
  children: React.ReactNode;
  /** Pinned under the scrolling body, above the home indicator. */
  footer?: React.ReactNode;
};

type FooterStore = { footer: React.ReactNode; listeners: Set<() => void> };

const footerStores = new Map<string, FooterStore>();

function footerStore(id: string): FooterStore {
  const found = footerStores.get(id);
  if (found !== undefined) return found;
  const created: FooterStore = { footer: null, listeners: new Set() };
  footerStores.set(id, created);
  return created;
}

const footerFrame = {
  paddingHorizontal: 18,
  paddingTop: 12,
  backgroundColor: colors.white,
  borderTopWidth: 1,
  borderTopColor: colors.lineOnLightSoft,
} as const;

function footerComponentFor(id: string): React.FC<BottomSheetFooterProps> {
  return function SheetFooter(props: BottomSheetFooterProps): React.ReactElement {
    const insets = useSafeAreaInsets();
    const content = React.useSyncExternalStore(
      (notify) => {
        footerStore(id).listeners.add(notify);
        return () => footerStore(id).listeners.delete(notify);
      },
      () => footerStore(id).footer
    );
    return (
      <BottomSheetFooter {...props} bottomInset={Math.max(insets.bottom, 16)}>
        <View style={footerFrame}>{content}</View>
      </BottomSheetFooter>
    );
  };
}

/**
 * The modal renders through a portal, so context from here never reaches its footer; a store
 * keyed by this sheet keeps one footer component mounted and hands it the latest content.
 */
function useFooterComponent(footer: React.ReactNode): React.FC<BottomSheetFooterProps> {
  const id = React.useId();
  React.useEffect(() => {
    const store = footerStore(id);
    store.footer = footer;
    store.listeners.forEach((notify) => notify());
  });
  React.useEffect(() => () => void footerStores.delete(id), [id]);
  return React.useMemo(() => footerComponentFor(id), [id]);
}

/**
 * A bottom sheet sized to its content, dismissed by a drag down, a tap on the scrim or the
 * hardware back button. It rides the keyboard so a focused field stays above the keys; text
 * fields inside it should be `BottomSheetTextInput` for that to hold across focus changes.
 * Opening dismisses the keyboard, so a sheet opened from a form is never half under the keys.
 *
 * Every open mounts a fresh modal (the `key`): a modal presented again after a dismiss can
 * come back mounted but closed, and dismissing one that was never presented leaves it stuck.
 *
 * Sheets stack (`push`): the library's default minimizes the sheet underneath when one opens
 * over it, and that minimize sometimes lands as a dismiss, closing both a beat later.
 */
export function Sheet({
  visible,
  onClose,
  closeLabel,
  children,
  footer,
}: SheetProps): React.ReactElement | null {
  const ref = React.useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [generation, setGeneration] = React.useState(0);
  const [wasVisible, setWasVisible] = React.useState(false);
  const FooterComponent = useFooterComponent(footer);
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
        opacity={0.45}
        style={[props.style, { backgroundColor: colors.gunmetal }]}
        accessibilityLabel={closeLabel}
      />
    ),
    [closeLabel]
  );

  if (generation === 0) return <></>;
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
      footerComponent={footer === undefined ? undefined : FooterComponent}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      backgroundStyle={{ borderRadius: radius.panel, backgroundColor: colors.white }}
      handleIndicatorStyle={{ width: 36, height: 4, backgroundColor: "rgba(64,63,76,0.2)" }}
    >
      <BottomSheetScrollView
        keyboardShouldPersistTaps="handled"
        enableFooterMarginAdjustment={footer !== undefined}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        {children}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}
