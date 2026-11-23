import React from "react";
import { ScrollView, View, type ScrollViewProps } from "react-native";
import { Keypad } from "./Keypad";
import { KeypadHostContext, type KeypadHost, type KeypadRequest } from "./keypadHost";
import { outsideTap } from "./outsideTap";
import { useKeepAboveKeypad } from "./useKeepAboveKeypad";

export type KeypadScrollViewProps = Omit<ScrollViewProps, "keyboardShouldPersistTaps"> & {
  /** Told when the keypad comes up and goes down, to hide a pinned footer meanwhile. */
  onKeypadChange?: (open: boolean) => void;
};

/**
 * A form's scroll view: text fields keep the system keyboard, and every number or time field
 * in it types on one keypad that lifts the field above itself and switches field on Next.
 * A tap anywhere else on screen closes the keypad, keeping what was typed, and still lands
 * (see `outsideTap`); a scroll leaves it up.
 */
export function KeypadScrollView({
  onKeypadChange,
  children,
  ...props
}: KeypadScrollViewProps): React.ReactElement {
  const { scrollProps, reveal, room } = useKeepAboveKeypad();
  const [request, setRequest] = React.useState<KeypadRequest | null>(null);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const current = React.useRef<KeypadRequest | null>(null);
  const host = React.useMemo<KeypadHost>(
    () => ({
      open: (r) => {
        const was = current.current;
        current.current = r;
        if (was !== null && was.id !== r.id) was.close();
        setRequest(r);
        setOpenId(r.id);
      },
      close: (id) => {
        if (current.current?.id === id) current.current = null;
        setOpenId((open) => (open === id ? null : open));
      },
    }),
    []
  );
  const open = openId !== null;

  React.useEffect(() => onKeypadChange?.(open), [open, onKeypadChange]);
  React.useEffect(
    () => (open && request !== null ? outsideTap.subscribe(request.close) : undefined),
    [open, request]
  );
  React.useEffect(() => {
    if (openId !== null && request !== null) reveal(request.box.current);
  }, [openId, request, reveal]);

  return (
    <KeypadHostContext.Provider value={host}>
      <ScrollView {...props} {...scrollProps} keyboardShouldPersistTaps="handled">
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
