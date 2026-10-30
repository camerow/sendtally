import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors, fonts, radius } from "@sendtally/design/tokens";
import { tap } from "../lib/press";
import { Keypad, type KeypadMode } from "./Keypad";
import { KeypadHostContext } from "./keypadHost";
import type { FieldSlot } from "./useFieldOrder";

export type KeypadFieldProps = FieldSlot & {
  /** Above the box, and on the keypad. */
  label: string;
  /** A small box sized to its value with no label shown, for a value in a table row. */
  compact?: boolean;
  /** A small box filling its table column, gold when `marked`. Implies no label, like `compact`. */
  cell?: { marked: boolean };
  /** Amber: a value short of what was asked, such as a set cut short. */
  short?: boolean;
  /** On the keypad under the value, with Reset when `onReset` is given. */
  note?: string;
  onReset?: () => void;
  /** What a screen reader and the keypad call it, when the label alone is not enough. */
  accessibilityLabel?: string;
  mode: KeypadMode;
  value: number;
  /** The value as read: dimmed leading part, then the rest. */
  text: readonly [dim: string, rest: string];
  /** Inside the box, on the right. */
  unit?: string;
  /** Beside the box, under the label, such as a stepper's − and +. */
  before?: React.ReactNode;
  after?: React.ReactNode;
  onChange: (value: number) => void;
};

const MARKED = "rgba(249,220,92,0.35)";
const MARKED_LINE = "rgba(194,124,14,0.45)";
const SHORT = "rgba(194,124,14,0.12)";
const AMBER_LINE = "#C27C0E";

/** The one label a typable number has, in the same voice as a form section's. */
export const keypadFieldLabel = {
  fontFamily: fonts.monoMedium,
  fontSize: 11,
  letterSpacing: 0.88,
  textTransform: "uppercase",
  color: colors.textSecondary,
} as const;

/**
 * A typable number: a white box under its label that opens the in-app keypad, gold while it
 * is open. Inside a `KeypadScrollView` it types on the screen's one keypad, else on its own.
 */
export function KeypadField({
  label,
  compact = false,
  cell,
  short = false,
  note,
  onReset,
  accessibilityLabel = label,
  mode,
  value,
  text: [dim, rest],
  unit,
  before,
  after,
  onChange,
  open: openSlot,
  onOpen,
  onClose,
  onNext,
}: KeypadFieldProps): React.ReactElement {
  const host = React.useContext(KeypadHostContext);
  const id = React.useId();
  const box = React.useRef<View>(null);
  const [openOwn, setOpenOwn] = React.useState(false);
  const open = openSlot ?? openOwn;
  const close = onClose ?? (() => setOpenOwn(false));
  const latest = React.useRef({
    accessibilityLabel,
    mode,
    value,
    onChange,
    close,
    onNext,
    note,
    onReset,
  });
  React.useEffect(() => {
    latest.current = { accessibilityLabel, mode, value, onChange, close, onNext, note, onReset };
  });
  React.useEffect(() => {
    if (!open || host === null) return;
    const field = latest.current;
    host.open({
      id,
      label: field.accessibilityLabel,
      mode: field.mode,
      value: field.value,
      box,
      hasNext: field.onNext !== undefined,
      commit: (typed) => latest.current.onChange(typed),
      close: () => latest.current.close(),
      next: () => latest.current.onNext?.(),
      note: field.note,
      reset: field.onReset === undefined ? undefined : () => latest.current.onReset?.(),
    });
    return () => host.close(id);
  }, [open, host, id]);

  return (
    <View style={[{ gap: 8 }, cell !== undefined && { flex: 1, minWidth: 0 }]}>
      {!compact && cell === undefined && (
        <Text numberOfLines={1} style={keypadFieldLabel}>
          {label}
        </Text>
      )}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {before}
        <Pressable
          ref={box}
          onPress={tap(onOpen ?? (() => setOpenOwn(true)))}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityValue={{ text: `${dim}${rest}${unit === undefined ? "" : ` ${unit}`}` }}
          accessibilityState={{ expanded: open }}
          style={[
            {
              flex: 1,
              minHeight: 46,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 6,
              paddingHorizontal: open ? 11.3 : 12,
              borderRadius: radius.control,
              backgroundColor: colors.white,
              borderWidth: open ? 2 : 1.3,
              borderColor: open ? colors.gold : colors.lineOnLightStrong,
            },
            compact && {
              flex: 0,
              minHeight: 36,
              minWidth: 36,
              justifyContent: "center",
              gap: 3,
              paddingHorizontal: open ? 7 : 8,
              borderRadius: 8,
              borderWidth: open ? 2 : 1,
            },
            short && !open && { backgroundColor: SHORT, borderWidth: 1.5, borderColor: AMBER_LINE },
            cell !== undefined && {
              flex: 1,
              minHeight: 36,
              minWidth: 0,
              justifyContent: "center",
              paddingHorizontal: 2,
              borderRadius: 8,
              borderWidth: open ? 2.5 : 1,
              borderColor: open
                ? colors.gold
                : cell.marked
                  ? MARKED_LINE
                  : colors.lineOnLightStrong,
              backgroundColor: cell.marked && !open ? MARKED : colors.white,
              shadowColor: open ? colors.gold : colors.gunmetal,
              shadowOffset: { width: 0, height: open ? 0 : 1 },
              shadowOpacity: open ? 0.6 : 0.06,
              shadowRadius: open ? 3 : 0,
            },
          ]}
        >
          <Text
            numberOfLines={1}
            style={{
              flexShrink: 1,
              fontFamily: fonts.monoSemiBold,
              fontSize: cell !== undefined ? 14 : compact ? 15 : 17,
              color: colors.gunmetal,
            }}
          >
            <Text style={{ color: colors.textFaint }}>{dim}</Text>
            {rest}
          </Text>
          {unit !== undefined && (
            <Text
              style={{
                fontFamily: fonts.mono,
                fontSize: compact ? 12 : 13,
                color: colors.textSecondary,
              }}
            >
              {unit}
            </Text>
          )}
        </Pressable>
        {after}
      </View>
      {host === null && (
        <Keypad
          visible={open}
          label={accessibilityLabel}
          mode={mode}
          value={value}
          onCommit={onChange}
          onClose={close}
          onNext={onNext}
          note={note}
          onReset={onReset}
        />
      )}
    </View>
  );
}
