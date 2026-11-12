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

/** The ··· menu: a dropdown anchored to its button on desktop, a bottom sheet at 375. */
export function MoreMenu({
  label,
  items,
}: {
  /** What the button and its menu are called to a screen reader. */
  label: string;
  items: readonly MoreMenuItem[];
}): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const narrow = useIsNarrow();
  const wrap = React.useRef<HTMLDivElement>(null);
  const close = React.useCallback(() => setOpen(false), []);

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
    <div className="more-wrap" ref={wrap}>
      <button
        type="button"
        className="more-button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((was) => !was)}
      >
        <Icon name="more" size={20} strokeWidth={3} />
      </button>
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
