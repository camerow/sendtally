import React from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router";
import { t } from "@sendtally/features/i18n";
import { entryKindLabel, today, type EntryKind } from "@sendtally/features/journal";
import { Icon, type IconName } from "../../components/Icon";
import { EntryKindIcon } from "../../journal/components/EntryKindIcon";
import { useIsNarrow } from "../../lib/useIsNarrow";
import { useStartLiveSession } from "../../live-session/useStartLiveSession";

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
  to,
  onClick,
}: {
  icon: IconName | EntryKind;
  title: string;
  hint: string;
  to?: string;
  onClick: () => void;
}): React.ReactElement {
  const className = "log-menu-item";
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

function Choices({ onPick }: { onPick: () => void }): React.ReactElement {
  const startLive = useStartLiveSession();
  return (
    <>
      <span className="log-menu-group">{t("statistics.climbing")}</span>
      <Row
        icon="climb"
        title={t("sessions.liveSession")}
        hint={t("sessions.liveSessionHint")}
        onClick={() => {
          onPick();
          startLive();
        }}
      />
      <Row
        icon="sessions"
        title={t("climbs.logSession")}
        hint={t("sessions.logFullSessionHint")}
        to="/app/sessions/new"
        onClick={onPick}
      />
      <Row
        icon="climbs"
        title={t("climbs.addClimb")}
        hint={t("climbs.addClimbHint")}
        to="/app/log/climbs/new"
        onClick={onPick}
      />
      <Row
        icon="trip"
        title={entryKindLabel("trip")}
        hint={t(HINTS.trip)}
        to={entryHref("trip")}
        onClick={onPick}
      />
      <span className="log-menu-group">{t("statistics.training")}</span>
      {(["journal", "injury"] as const).map((kind) => (
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
 * Adding a climb is the frequent action, so it gets the wide half. The chevron half holds every
 * way to log, climbing then training. Desktop anchors a menu to the button in the header; the
 * phone floats it and opens the menu as a sheet.
 */
export function LogMenu({ variant }: { variant: "header" | "fab" }): React.ReactElement {
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
        <Link to="/app/log/climbs/new" className="log-split-main">
          <Icon name="plus" size={17} strokeWidth={3} />
          {t("climbs.addClimb")}
        </Link>
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
          <Choices onPick={close} />
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
                <Choices onPick={close} />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
