import React from "react";
import { t } from "@sendtally/features/i18n";

export type SheetAction = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** The red outline, for a delete. */
  danger?: boolean;
};

export type SheetProps = {
  open: boolean;
  title: string;
  /** A short line above the title in the label voice, such as the day it schedules on. */
  kicker?: string;
  /** Amber for a warning, such as "Already running"; grey by default. */
  kickerTone?: "amber";
  onClose: () => void;
  /** The footer's one button; Cancel sits beside it on desktop. */
  action?: SheetAction;
  /** Off when the action only closes, such as Done, so Cancel would offer the same thing. */
  cancel?: boolean;
  children?: React.ReactNode;
};

/**
 * Anything typed into: a centred dialog on desktop, the bottom sheet at 375. Escape and the
 * scrim close it. A child marked `data-autofocus` takes focus on open; React's `autoFocus`
 * fires before the dialog opens, so the dialog would move focus to its first field instead.
 */
export function Sheet({ open, ...props }: SheetProps): React.ReactElement | null {
  return open ? <OpenSheet {...props} /> : null;
}

function OpenSheet({
  title,
  kicker,
  kickerTone,
  onClose,
  action,
  cancel = true,
  children,
}: Omit<SheetProps, "open">): React.ReactElement {
  const dialog = React.useRef<HTMLDialogElement>(null);
  const pressedScrim = React.useRef(false);
  const titleId = React.useId();

  React.useEffect(() => {
    const el = dialog.current;
    if (el === null || el.open) return;
    el.showModal();
    // Without a field to start in, the dialog holds focus itself rather than ringing its first control.
    (el.querySelector<HTMLElement>("[data-autofocus]") ?? el).focus();
  }, []);

  return (
    <dialog
      ref={dialog}
      className="sheet"
      tabIndex={-1}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onPointerDown={(e) => {
        pressedScrim.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (pressedScrim.current && e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sheet-handle" />
      <div className="sheet-head">
        {kicker !== undefined && (
          <span
            className={kickerTone === "amber" ? "sheet-kicker sheet-kicker--amber" : "sheet-kicker"}
          >
            {kicker}
          </span>
        )}
        <h2 id={titleId} className="sheet-title">
          {title}
        </h2>
      </div>
      {children}
      {action !== undefined && (
        <div className="sheet-footer">
          {cancel && (
            <button type="button" className="sheet-cancel" onClick={onClose}>
              {t("common.cancel")}
            </button>
          )}
          <button
            type="button"
            className={
              action.danger === true ? "sheet-action sheet-action--danger" : "sheet-action"
            }
            disabled={action.disabled}
            onClick={action.onPress}
          >
            {action.label}
          </button>
        </div>
      )}
    </dialog>
  );
}
