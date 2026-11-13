import React from "react";
import { createPortal } from "react-dom";
import { useIsNarrow } from "../lib/useIsNarrow";
import { Icon } from "./Icon";
import type { MoreMenuItem } from "./MoreMenu";

export type PageActionProps = {
  label: string;
} & (
  | { onPress: () => void; items?: undefined }
  | { items: readonly MoreMenuItem[]; onPress?: undefined }
);

/**
 * A page's one button, such as Create or Schedule: gunmetal with the gold plus at the right of
 * the title row on desktop, floating bottom right at 375. With items it opens a menu, a
 * dropdown on desktop and a bottom sheet at 375. Link components/page-action.css.
 */
export function PageAction({ label, items, onPress }: PageActionProps): React.ReactElement {
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

  const rows =
    items === undefined
      ? null
      : items.map((item) => (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            className={item.destructive === true ? "more-item more-item--danger" : "more-item"}
            disabled={item.disabled}
            onClick={() => {
              close();
              item.onSelect();
            }}
          >
            {item.label}
          </button>
        ));

  return (
    <div className="page-action-wrap" ref={wrap}>
      <button
        type="button"
        className="page-action"
        aria-haspopup={items === undefined ? undefined : "menu"}
        aria-expanded={items === undefined ? undefined : open}
        onClick={() => (items === undefined ? onPress?.() : setOpen((was) => !was))}
      >
        <span className="page-action-plus">
          <Icon name="plus" size={18} strokeWidth={2.6} />
        </span>
        {label}
      </button>
      {open && !narrow && (
        <div className="more-menu" role="menu" aria-label={label}>
          {rows}
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
              {rows}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
