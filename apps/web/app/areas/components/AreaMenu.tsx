import React from "react";
import { createPortal } from "react-dom";
import { t } from "@sendtally/features/i18n";
import { Icon } from "../../components/Icon";
import { useIsNarrow } from "../../lib/useIsNarrow";

export type AreaMenuItem = { label: string; onSelect: () => void; disabled?: boolean };

function Items({
  items,
  onPick,
}: {
  items: AreaMenuItem[];
  onPick: () => void;
}): React.ReactElement {
  return (
    <>
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          className="area-menu-item"
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

/** The page's "…" menu: anchored to the button on desktop, a bottom sheet on the phone. */
export function AreaMenu({ items }: { items: AreaMenuItem[] }): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const narrow = useIsNarrow();
  const wrap = React.useRef<HTMLDivElement>(null);
  const close = React.useCallback(() => setOpen(false), []);

  React.useEffect(() => {
    if (!open || narrow) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: PointerEvent): void => {
      if (wrap.current?.contains(e.target as Node) !== true) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open, narrow]);

  return (
    <div className="area-more-wrap" ref={wrap}>
      <button
        type="button"
        className="area-more"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("areas.moreActions")}
        onClick={() => setOpen((was) => !was)}
      >
        <Icon name="more" size={20} strokeWidth={3} />
      </button>
      {open && !narrow && (
        <div className="area-menu" role="menu" aria-label={t("areas.moreActions")}>
          <Items items={items} onPick={close} />
        </div>
      )}
      {open &&
        narrow &&
        createPortal(
          <div className="sessions-sheet-backdrop" onClick={close}>
            <div
              className="sessions-sheet"
              role="menu"
              aria-label={t("areas.moreActions")}
              onClick={(event) => event.stopPropagation()}
              style={{ gap: 8 }}
            >
              <div className="sessions-sheet-handle" />
              <Items items={items} onPick={close} />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
