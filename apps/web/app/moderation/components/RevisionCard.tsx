import React from "react";
import { Link } from "react-router";
import { Button } from "@sendtally/design";
import type { RevisionItem, SendtallyApi } from "@sendtally/api-client";
import {
  diffRows,
  queuedOn,
  resolutionsOf,
  revisionVersion,
  useModerationAction,
  type Side,
} from "@sendtally/features/areas";
import { t } from "@sendtally/features/i18n";
import { ModCard } from "./ModCard";
import { NoteDialog } from "./NoteDialog";

export function RevisionCard({
  api,
  item,
}: {
  api: SendtallyApi;
  item: RevisionItem;
}): React.ReactElement {
  const { busy, error, run } = useModerationAction();
  const [picks, setPicks] = React.useState<Partial<Record<string, Side>>>({});
  const [rejecting, setRejecting] = React.useState(false);
  const [unpicked, setUnpicked] = React.useState(false);
  const rows = diffRows(item);
  const name = String(item.current?.["name"] ?? item.base["name"] ?? "");
  const href =
    item.slug === null
      ? null
      : item.entity_type === "area"
        ? `/app/areas/${item.slug}`
        : `/app/climbs/${item.slug}`;

  function approve(): void {
    const resolutions = resolutionsOf(item, picks);
    const version = revisionVersion(item);
    setUnpicked(resolutions === null);
    if (resolutions === null || version === null) return;
    void run(() => api.approveRevision(item.id, version, resolutions));
  }

  const pick = (field: string, side: Side, value: string): React.ReactElement => (
    <label className="mod-pick">
      <input
        type="radio"
        name={`${item.id}-${field}`}
        checked={picks[field] === side}
        onChange={() => setPicks((p) => ({ ...p, [field]: side }))}
      />
      <span>{value}</span>
    </label>
  );

  return (
    <ModCard
      kicker={`${t(item.entity_type === "area" ? "moderation.area" : "moderation.climb")} · ${queuedOn(item.created_at)}`}
      error={rejecting ? null : unpicked ? t("moderation.pickEveryConflict") : error}
      actions={
        <>
          <Button variant="ghostOnLight" size="sm" onClick={() => setRejecting(true)}>
            {t("moderation.reject")}
          </Button>
          <Button variant="azure" size="sm" disabled={busy} onClick={approve}>
            {t("moderation.approve")}
          </Button>
        </>
      }
    >
      <div className="mod-title-row">
        {href === null ? (
          <span className="mod-title">{t("moderation.editTo", { name })}</span>
        ) : (
          <Link to={href} className="mod-title">
            {t("moderation.editTo", { name })}
          </Link>
        )}
        {item.current === null && <span className="area-meta">{t("moderation.noLongerLive")}</span>}
      </div>
      {item.change_summary !== null && <p className="mod-quote">{item.change_summary}</p>}
      <div className="mod-diff" role="table">
        <div className="mod-diff-row mod-diff-head" role="row">
          <span role="columnheader" className="mod-diff-field" />
          <span role="columnheader">{t("moderation.before")}</span>
          <span role="columnheader">{t("moderation.proposed")}</span>
          <span role="columnheader">{t("moderation.now")}</span>
        </div>
        {rows.map((row) => (
          <div
            key={row.field}
            role="row"
            className={row.conflict ? "mod-diff-row mod-diff-row--conflict" : "mod-diff-row"}
          >
            <span role="rowheader" className="mod-diff-field">
              {row.label}
            </span>
            <span role="cell" className="mod-diff-before">
              {row.before}
            </span>
            <span role="cell">
              {row.conflict ? pick(row.field, "proposed", row.proposed) : row.proposed}
            </span>
            <span role="cell">{row.conflict ? pick(row.field, "current", row.now) : row.now}</span>
          </div>
        ))}
      </div>
      {item.conflicts.length > 0 && (
        <span className="mod-muted">{t("moderation.conflictHint")}</span>
      )}
      {rejecting && (
        <NoteDialog
          title={t("moderation.rejectEditTitle", { name })}
          submitLabel={t("moderation.reject")}
          busy={busy}
          error={error}
          onClose={() => setRejecting(false)}
          onSubmit={(note) =>
            void run(async () => {
              await api.rejectRevision(item.id, note);
              setRejecting(false);
            })
          }
        />
      )}
    </ModCard>
  );
}
