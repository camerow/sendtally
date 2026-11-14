import React from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";
import { useIsNarrow } from "../lib/useIsNarrow";

export type MoreMenuItem = {
  label: string;
  onSelect: () => void;
  /** Red text, for a delete; the confirm it opens is the caller's. */
  destructive?: boolean;
  disabled?: boolean;
};

function Items({
  items,
  onPick,
}: {
  items: readonly MoreMenuItem[];
  onPick: () => void;
}): React.ReactElement {
  return (
    <>
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          className={item.destructive === true ? "more-item more-item--danger" : "more-item"}
          disabled={item.disabled}
          onClick={() => {
            onPick();
            item.onSelect();
          }}
        >
          {item.label}
        </button>
      ))}
    </>
  );
}

/** What a menu's button needs: its popup role, whether it is open, and the press that toggles it. */
export type TriggerProps = {
  "aria-haspopup": "menu";
  "aria-expanded": boolean;
  onClick: () => void;
};

/** The ··· menu: a dropdown anchored to its button on desktop, a bottom sheet at 375. */
export function MoreMenu({
  label,
  items,
  trigger,
  className = "more-wrap",
}: {
  /** What the button and its menu are called to a screen reader. */
  label: string;
  items: readonly MoreMenuItem[];
  /** In place of the ··· button, such as a page's Create; it opens and closes the menu. */
  trigger?: (button: TriggerProps) => React.ReactNode;
  /** The wrapper's class, which positions the button and its dropdown. */
  className?: string;
}): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const narrow = useIsNarrow();
  const wrap = React.useRef<HTMLDivElement>(null);
  const close = React.useCallback(() => setOpen(false), []);
  const button: TriggerProps = {
    "aria-haspopup": "menu",
    "aria-expanded": open,
    onClick: () => setOpen((was) => !was),
  };

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: PointerEvent): void => {
      if (!narrow && wrap.current?.contains(e.target as Node) !== true) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open, narrow]);

  return (
    <div className={className} ref={wrap}>
      {trigger === undefined ? (
        <button type="button" className="more-button" aria-label={label} {...button}>
          <Icon name="more" size={20} strokeWidth={3} />
        </button>
      ) : (
        trigger(button)
      )}
      {open && !narrow && (
        <div className="more-menu" role="menu" aria-label={label}>
          <Items items={items} onPick={close} />
        </div>
      )}
      {open &&
        narrow &&
        createPortal(
          <div className="more-sheet-scrim" onClick={close}>
            <div
              className="more-sheet"
              role="menu"
              aria-label={label}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="sheet-handle" />
              <Items items={items} onPick={close} />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
