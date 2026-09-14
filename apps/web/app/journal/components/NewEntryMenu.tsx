import React from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router";
import { t } from "@sendtally/features/i18n";
import { ENTRY_KINDS, entryKindLabel, today, type EntryKind } from "@sendtally/features/journal";
import { useIsNarrow } from "../../lib/useIsNarrow";
import { EntryKindIcon } from "./EntryKindIcon";

const HINTS: Record<EntryKind, "journal.hintJournal" | "journal.hintTrip" | "journal.hintInjury"> =
  {
    journal: "journal.hintJournal",
    trip: "journal.hintTrip",
    injury: "journal.hintInjury",
  };

const hrefFor = (kind: EntryKind): string => `/app/journal/new?kind=${kind}&date=${today()}`;

function Caret(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 16 16"
      width={12}
      height={12}
      aria-hidden
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flex: "none" }}
    >
      <path d="M4 6.2 8 10.2l4-4" />
    </svg>
  );
}

function Choices({ onPick }: { onPick: () => void }): React.ReactElement {
  return (
    <>
      {ENTRY_KINDS.map((kind) => (
        <Link
          key={kind}
          to={hrefFor(kind)}
          role="menuitem"
          className="entry-menu-item"
          onClick={onPick}
        >
          <span className="entry-menu-icon">
            <EntryKindIcon kind={kind} />
          </span>
          <span className="entry-menu-text">
            <span className="entry-menu-name">{entryKindLabel(kind)}</span>
            <span className="entry-menu-hint">{t(HINTS[kind])}</span>
          </span>
        </Link>
      ))}
    </>
  );
}

/**
 * The kind is chosen on the way in rather than at the top of the form, so the
 * composer opens already being the thing you picked. Desktop anchors a menu to
 * the button; the phone gets the sheet it already uses for filters.
 */
export function NewEntryMenu({
  variant = "header",
}: {
  /** "header" sits beside Log a session on desktop; "fab" floats above it on the phone. */
  variant?: "header" | "fab";
}): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const narrow = useIsNarrow();
  const wrap = React.useRef<HTMLDivElement>(null);
  const sheet = React.useRef<HTMLDivElement>(null);
  const close = React.useCallback(() => setOpen(false), []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: PointerEvent): void => {
      const target = e.target as Node;
      if (wrap.current?.contains(target) === true) return;
      // The sheet is portalled out of the wrapper; its own backdrop closes it.
      if (sheet.current?.contains(target) === true) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <div className={`entry-menu-wrap entry-menu-wrap--${variant}`} ref={wrap}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((was) => !was)}
        className={[
          variant === "fab" ? "entry-menu-fab" : "sessions-ghost-link",
          open ? "is-open" : null,
        ]
          .filter((part) => part !== null)
          .join(" ")}
      >
        {t("journal.writeAnEntry")}
        <Caret />
      </button>

      {open && !narrow && (
        <div className="entry-menu" role="menu" aria-label={t("journal.newEntry")}>
          <Choices onPick={close} />
        </div>
      )}

      {/* The fab wrapper is fixed, so it caps everything inside it below the tab
          bar. The sheet goes to the body instead. */}
      {open &&
        narrow &&
        createPortal(
          <div className="sessions-sheet-backdrop" ref={sheet} onClick={close}>
            <div
              className="sessions-sheet"
              role="menu"
              aria-label={t("journal.newEntry")}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="sessions-sheet-handle" />
              <span className="entry-menu-head">{t("journal.newEntry")}</span>
              <Choices onPick={close} />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
