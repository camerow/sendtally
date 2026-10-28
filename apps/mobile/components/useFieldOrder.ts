import React from "react";

/** How a keypad field opens and closes when a form, not the field, decides which one is open. */
export type FieldSlot = {
  open?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  /** Shows Next on the keypad, which commits and then calls this. */
  onNext?: () => void;
};

/**
 * Fields that read as a row, in order: at most one is open, and Next on one opens the one
 * after it. Spread `slot(key)` into each field; the last has no Next.
 */
export function useFieldOrder(keys: readonly string[]): {
  slot: (key: string) => FieldSlot;
  open: string | null;
} {
  const [open, setOpen] = React.useState<string | null>(null);
  const slot = (key: string): FieldSlot => {
    const next = keys[keys.indexOf(key) + 1];
    return {
      open: open === key,
      onOpen: () => setOpen(key),
      onClose: () => setOpen((current) => (current === key ? null : current)),
      onNext: next === undefined ? undefined : () => setOpen(next),
    };
  };
  return { slot, open };
}
