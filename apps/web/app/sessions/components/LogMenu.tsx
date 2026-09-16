import React from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router";
import { t } from "@sendtally/features/i18n";
import { ENTRY_KINDS, entryKindLabel, today, type EntryKind } from "@sendtally/features/journal";
import { Icon, type IconName } from "../../components/Icon";
import { EntryKindIcon } from "../../journal/components/EntryKindIcon";
import { useIsNarrow } from "../../lib/useIsNarrow";

const HINTS: Record<EntryKind, "journal.hintJournal" | "journal.hintTrip" | "journal.hintInjury"> =
  {
    journal: "journal.hintJournal",
    trip: "journal.hintTrip",
    injury: "journal.hintInjury",
  };

const entryHref = (kind: EntryKind): string => `/app/journal/new?kind=${kind}&date=${today()}`;

function Row({
  icon,
  title,
  hint,
  highlighted = false,
  to,
  onClick,
}: {
  icon: IconName | EntryKind;
  title: string;
  hint: string;
  highlighted?: boolean;
  to?: string;
  onClick: () => void;
}): React.ReactElement {
  const className = highlighted ? "log-menu-item is-highlighted" : "log-menu-item";
  const body = (
    <>
      <span className="log-menu-icon">
        {icon === "journal" || icon === "trip" || icon === "injury" ? (
          <EntryKindIcon kind={icon} />
        ) : (
          <Icon name={icon} size={20} strokeWidth={2} />
        )}
      </span>
      <span className="log-menu-text">
        <span className="log-menu-name">{title}</span>
        <span className="log-menu-hint">{hint}</span>
      </span>
      <Icon name="chevron" size={12} strokeWidth={2} />
    </>
  );
  return to === undefined ? (
    <button type="button" role="menuitem" className={className} onClick={onClick}>
      {body}
    </button>
  ) : (
    <Link to={to} role="menuitem" className={className} onClick={onClick}>
      {body}
    </Link>
  );
}

function Choices({
  onLogClimb,
  onPick,
}: {
  onLogClimb: () => void;
  onPick: () => void;
}): React.ReactElement {
  return (
    <>
      <Row
        icon="plus"
        title={t("sessions.logAClimb")}
        hint={t("sessions.logAClimbHint")}
        highlighted
        onClick={() => {
          onPick();
          onLogClimb();
        }}
      />
      <Row
        icon="sessions"
        title={t("sessions.logFullSession")}
        hint={t("sessions.logFullSessionHint")}
        to="/app/sessions/new"
        onClick={onPick}
      />
      {ENTRY_KINDS.map((kind) => (
        <Row
          key={kind}
          icon={kind}
          title={entryKindLabel(kind)}
          hint={t(HINTS[kind])}
          to={entryHref(kind)}
          onClick={onPick}
        />
      ))}
    </>
  );
}

/**
 * One climb is the frequent action, so it gets the wide half. The chevron half holds the
 * slower paths: the full form and the journal entry kinds. Desktop anchors a menu to the
 * button in the header; the phone floats it and gets the sheet it already uses for filters.
 */
export function LogMenu({
  variant,
  onLogClimb,
}: {
  variant: "header" | "fab";
  onLogClimb: () => void;
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
    <div className={`log-menu-wrap log-menu-wrap--${variant}`} ref={wrap}>
      <div className="log-split">
        <button type="button" className="log-split-main" onClick={onLogClimb}>
          <Icon name="plus" size={17} strokeWidth={3} />
          {t("sessions.logClimb")}
        </button>
        <button
          type="button"
          className="log-split-more"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={t("sessions.moreWaysToLog")}
          onClick={() => setOpen((was) => !was)}
        >
          <Icon name="chevron" size={14} strokeWidth={2.4} />
        </button>
      </div>

      {open && !narrow && (
        <div className="log-menu" role="menu" aria-label={t("sessions.moreWaysToLog")}>
          <Choices onLogClimb={onLogClimb} onPick={close} />
        </div>
      )}

      {open &&
        narrow &&
        createPortal(
          <div className="sessions-sheet-backdrop" ref={sheet} onClick={close}>
            <div
              className="sessions-sheet"
              role="menu"
              aria-label={t("sessions.moreWaysToLog")}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="sessions-sheet-handle" />
              <div className="log-menu-sheet">
                <Choices onLogClimb={onLogClimb} onPick={close} />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
