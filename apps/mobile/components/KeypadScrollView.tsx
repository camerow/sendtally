import React from "react";
import { ScrollView, View, type ScrollViewProps } from "react-native";
import { Keypad } from "./Keypad";
import { KeypadHostContext, type KeypadHost, type KeypadRequest } from "./keypadHost";
import { useKeepAboveKeypad } from "./useKeepAboveKeypad";

export type KeypadScrollViewProps = Omit<ScrollViewProps, "keyboardShouldPersistTaps"> & {
  /** Told when the keypad comes up and goes down, to hide a pinned footer meanwhile. */
  onKeypadChange?: (open: boolean) => void;
};

/**
 * A form's scroll view: text fields keep the system keyboard, and every number or time field
 * in it types on one keypad that lifts the field above itself and switches field on Next.
 */
export function KeypadScrollView({
  onKeypadChange,
  children,
  ...props
}: KeypadScrollViewProps): React.ReactElement {
  const { scrollRef, onScroll, reveal, room } = useKeepAboveKeypad();
  const [request, setRequest] = React.useState<KeypadRequest | null>(null);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const host = React.useMemo<KeypadHost>(
    () => ({
      open: (r) => {
        setRequest(r);
        setOpenId(r.id);
      },
      close: (id) => setOpenId((open) => (open === id ? null : open)),
    }),
    []
  );
  const open = openId !== null;

  React.useEffect(() => onKeypadChange?.(open), [open, onKeypadChange]);
  React.useEffect(() => {
    if (openId !== null && request !== null) reveal(request.box.current);
  }, [openId, request, reveal]);

  return (
    <KeypadHostContext.Provider value={host}>
      <ScrollView
        {...props}
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >
        {children}
        {open && <View testID="keypad-room" style={{ height: room }} />}
      </ScrollView>
      {request !== null && (
        <Keypad
          visible={open}
          field={request.id}
          label={request.label}
          mode={request.mode}
          value={request.value}
          onCommit={request.commit}
          onClose={request.close}
          onNext={request.hasNext ? request.next : undefined}
        />
      )}
    </KeypadHostContext.Provider>
  );
}
