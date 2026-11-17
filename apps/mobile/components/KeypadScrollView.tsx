import React from "react";
import { ScrollView, View, type ScrollViewProps } from "react-native";
import { Keypad } from "./Keypad";
import { KeypadHostContext, type KeypadHost, type KeypadRequest } from "./keypadHost";
import { useKeepAboveKeypad } from "./useKeepAboveKeypad";

/** How far a finger may drift and still tap, the same slop a press allows. */
const TAP_SLOP = 10;

export type KeypadScrollViewProps = Omit<ScrollViewProps, "keyboardShouldPersistTaps"> & {
  /** Told when the keypad comes up and goes down, to hide a pinned footer meanwhile. */
  onKeypadChange?: (open: boolean) => void;
};

/**
 * A form's scroll view: text fields keep the system keyboard, and every number or time field
 * in it types on one keypad that lifts the field above itself and switches field on Next.
 * A tap anywhere else in it closes the keypad, keeping what was typed, and still lands; a
 * scroll leaves it up.
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
  const touch = React.useRef<{ x: number; y: number } | null>(null);

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
        onTouchStart={(e) => {
          touch.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
          props.onTouchStart?.(e);
        }}
        onTouchEnd={(e) => {
          const from = touch.current;
          touch.current = null;
          const moved =
            from === null ||
            Math.hypot(e.nativeEvent.pageX - from.x, e.nativeEvent.pageY - from.y) > TAP_SLOP;
          if (open && !moved) request?.close();
          props.onTouchEnd?.(e);
        }}
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
          onPrev={request.hasPrev ? request.prev : undefined}
          note={request.note}
          onReset={request.reset}
          onType={request.type}
        />
      )}
    </KeypadHostContext.Provider>
  );
}
