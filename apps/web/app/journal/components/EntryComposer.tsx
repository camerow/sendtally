import React from "react";
import { useNavigate } from "react-router";
import type { JournalEntry, SendtallyApi, SessionRow } from "@sendtally/api-client";
import { t } from "@sendtally/features/i18n";
import {
  ENTRY_BODY_MAX,
  isUpdateDraft,
  spansDates,
  useEntryComposer,
  type EntryDraft,
} from "@sendtally/features/journal";
import { useTagVocabulary } from "@sendtally/features/sessions";
import { TagPicker } from "../../components/TagPicker";
import { SessionPicker } from "./SessionPicker";
import { SeverityPicker } from "./SeverityPicker";
import { TripPreview } from "./TripPreview";

const label: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(64,63,76,0.72)",
};

const input: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 15,
  color: "var(--bs-gunmetal)",
  background: "var(--bs-white)",
  border: "1px solid rgba(64,63,76,0.15)",
  borderRadius: "var(--radius-control)",
  padding: "12px 14px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

function Field({
  name,
  children,
}: {
  name: React.ReactNode;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      <span style={label}>{name}</span>
      {children}
    </label>
  );
}

export function EntryComposer({
  api,
  initial,
  editing,
  heading,
  sessions,
  entries,
}: {
  api: SendtallyApi;
  initial: EntryDraft;
  editing?: string;
  heading: string;
  sessions: SessionRow[];
  entries: JournalEntry[];
}): React.ReactElement {
  const navigate = useNavigate();
  // An update has no page of its own - it is read on the thread it belongs to.
  const onSaved = React.useCallback(
    (entry: JournalEntry) =>
      navigate(`/app/journal/${encodeURIComponent(entry.parent_id ?? entry.id)}`),
    [navigate]
  );
  const { draft, setDraft, saving, error, trip, overlap, save } = useEntryComposer(api, initial, {
    editing,
    sessions,
    entries,
    onSaved,
  });
  const { suggestionsFor } = useTagVocabulary(api);
  const spanning = spansDates(draft.kind);
  // An update belongs to its thread: it never picks a kind, and it is the one
  // place the number matters more than the words.
  const update = isUpdateDraft(draft);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 720 }}>
      <div className="journal-head-row">
        <h1 className="journal-title">{heading}</h1>
      </div>

      {(update || draft.kind === "injury") && (
        <>
          <SeverityPicker
            severity={draft.severity}
            onChange={(severity) => setDraft((d) => ({ ...d, severity }))}
          />
          <span style={{ ...label, textTransform: "none", letterSpacing: 0, fontSize: 12 }}>
            {t("journal.severityOptional")}
          </span>
        </>
      )}

      <div className="entry-dates">
        <Field name={spanning ? t("journal.startDate") : t("journal.date")}>
          <input
            type="date"
            value={draft.occurredAt}
            onChange={(e) => setDraft((d) => ({ ...d, occurredAt: e.target.value }))}
            className="log-session-control"
            style={input}
          />
        </Field>
        {spanning && (
          <Field name={t("journal.endDate")}>
            <input
              type="date"
              value={draft.endsAt}
              min={draft.occurredAt}
              onChange={(e) => setDraft((d) => ({ ...d, endsAt: e.target.value }))}
              className="log-session-control"
              style={input}
              placeholder={t("journal.endDateOpen")}
            />
          </Field>
        )}
      </div>
      {overlap !== null && (
        <span role="alert" className="journal-error" style={{ marginTop: -12 }}>
          {overlap}
        </span>
      )}

      {!update && (
        <Field name={t("journal.entryTitle")}>
          <input
            value={draft.title}
            maxLength={200}
            placeholder={t("journal.entryTitlePlaceholder")}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            className="log-session-control"
            style={input}
          />
        </Field>
      )}

      <Field name={update ? t("journal.whatChanged") : t("journal.body")}>
        <textarea
          value={draft.body}
          rows={update ? 4 : 10}
          maxLength={ENTRY_BODY_MAX}
          placeholder={update ? t("journal.updatePlaceholder") : t("journal.bodyPlaceholder")}
          onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
          className="log-session-control"
          style={{ ...input, lineHeight: 1.6, resize: "vertical" }}
        />
      </Field>

      {!update && (
        <Field name={t("common.tags")}>
          <TagPicker
            tags={draft.tags}
            suggestions={suggestionsFor(draft.tags)}
            onAdd={(name) => setDraft((d) => ({ ...d, tags: [...d.tags, name] }))}
            onRemove={(name) => setDraft((d) => ({ ...d, tags: d.tags.filter((x) => x !== name) }))}
          />
        </Field>
      )}

      {draft.kind === "trip" ? (
        trip !== null && <TripPreview trip={trip} />
      ) : (
        <SessionPicker
          sessions={sessions}
          occurredAt={draft.occurredAt}
          endsAt={draft.endsAt}
          value={draft.fingerprints}
          onChange={(fingerprints) => setDraft((d) => ({ ...d, fingerprints }))}
        />
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {error !== null && (
          <span style={{ ...label, color: "var(--bs-watermelon-ink)", textTransform: "none" }}>
            {error}
          </span>
        )}
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={save}
          disabled={saving || overlap !== null}
          className="journal-save"
        >
          {saving ? t("common.saving") : t("journal.saveEntry")}
        </button>
      </div>
    </div>
  );
}
