import React from "react";
import type { LibraryEdit, LibraryEntry, SendtallyApi } from "@sendtally/api-client";
import { TRANSLATED_LOCALES, type TranslatedLocale } from "@sendtally/core/hang";
import { MAX_DESCRIPTION } from "@sendtally/core/text";
import { Button } from "@sendtally/design";
import { formatDate, formatNumber } from "@sendtally/features/i18n";
import {
  categoryLabel,
  changeRestore,
  changeSummary,
  entryKicker,
  entryKind,
  useLibraryEditing,
} from "@sendtally/features/library";
import { KIND_LOOK } from "@sendtally/features/training";
import { AreaDialog } from "../../areas/components/AreaDialog";
import { Field } from "../../areas/components/Field";
import { inputStyle } from "../../components/styles";
import { Description } from "../../training/components/Description";
import { LibraryMediaCard } from "./LibraryMediaCard";

const LANGUAGES: Record<TranslatedLocale, string> = {
  de: "German",
  fr: "French",
  es: "Spanish",
};

type Names = Partial<Record<TranslatedLocale, string>>;

const namesOf = (entry: LibraryEntry): Names =>
  Object.fromEntries(TRANSLATED_LOCALES.map((l) => [l, entry.translations[l]?.name ?? ""]));

const messageOf = (error: unknown): string =>
  error instanceof Error && error.message !== "" ? error.message : "Could not save.";

export type LibraryItemEditorProps = {
  api: SendtallyApi;
  entry: LibraryEntry;
  onBack: () => void;
};

/**
 * One built-in's English text, its names in other languages, and its changes. Editing the
 * English name empties the other names, so no one reads a stale one.
 */
export function LibraryItemEditor({
  api,
  entry,
  onBack,
}: LibraryItemEditorProps): React.ReactElement {
  const editing = useLibraryEditing(api, entry);
  const [name, setName] = React.useState(entry.name);
  const [names, setNames] = React.useState<Names>(() => namesOf(entry));
  const [description, setDescription] = React.useState(entry.description);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [retiring, setRetiring] = React.useState(false);
  const kind = entryKind(entry);
  const saved: LibraryEdit = {
    name: entry.name,
    description: entry.description,
    names: namesOf(entry),
    status: entry.status,
  };
  const draft: LibraryEdit = { name: name.trim(), description, names, status: entry.status };
  const changed = JSON.stringify(draft) !== JSON.stringify(saved);
  const named = TRANSLATED_LOCALES.filter((l) => (names[l] ?? "").trim() !== "").length;

  const run = async (write: () => Promise<void>): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      await write();
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  };
  const rename = (value: string): void => {
    if (name === entry.name && value !== entry.name) setNames({});
    setName(value);
  };
  const setStatus = (status: LibraryEdit["status"]): Promise<void> =>
    run(() => editing.save({ ...saved, status }));

  return (
    <div className="mod-lib-item">
      <button type="button" className="mod-lib-back" onClick={onBack}>
        ‹ Library
      </button>
      <div className="mod-lib-item-head">
        <div className="mod-lib-item-title">
          <span className="mod-lib-mono" style={{ color: KIND_LOOK[kind].ink }}>
            {entryKicker(entry)}
            {entry.status === "retired" && " · retired"}
          </span>
          <h2 className="sessions-title">{entry.name}</h2>
        </div>
        <div className="mod-actions">
          {entry.status === "active" ? (
            <Button variant="ghostOnLight" onClick={() => setRetiring(true)} disabled={busy}>
              Retire
            </Button>
          ) : (
            <Button variant="ghostOnLight" onClick={() => void setStatus("active")} disabled={busy}>
              Unretire
            </Button>
          )}
          <Button
            variant="azure"
            onClick={() => {
              if (changed && draft.name !== "") void run(() => editing.save(draft));
            }}
            disabled={busy || !changed || draft.name === ""}
          >
            Save
          </Button>
        </div>
      </div>
      {error !== null && !retiring && (
        <span className="area-error" role="alert">
          {error}
        </span>
      )}

      <div className="mod-lib-edit">
        <div className="mod-lib-fields">
          <Field id="library-name" label="Name · English">
            <input
              id="library-name"
              value={name}
              maxLength={80}
              onChange={(e) => rename(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <details className="mod-lib-fold">
            <summary>{`Other languages · ${formatNumber(named)} names`}</summary>
            {TRANSLATED_LOCALES.map((locale) => (
              <Field key={locale} id={`library-name-${locale}`} label={LANGUAGES[locale]} optional>
                <input
                  id={`library-name-${locale}`}
                  value={names[locale] ?? ""}
                  maxLength={80}
                  onChange={(e) => setNames({ ...names, [locale]: e.target.value })}
                  style={inputStyle}
                />
              </Field>
            ))}
          </details>
          <Field id="library-description" label="Description · English">
            <textarea
              id="library-description"
              className="form-notes"
              value={description}
              maxLength={MAX_DESCRIPTION}
              onChange={(e) => setDescription(e.target.value)}
              style={{ ...inputStyle, minHeight: 200 }}
            />
            <span className="mod-lib-faint">
              {`${formatNumber(description.length)} of ${formatNumber(MAX_DESCRIPTION)}`}
            </span>
          </Field>
        </div>
        <div className="mod-lib-preview" aria-label="Preview">
          {entry.media[0] !== undefined && (
            <img
              className="mod-lib-preview-picture"
              src={entry.media[0].url}
              alt={entry.media[0].alt}
            />
          )}
          <span className="mod-lib-mono" style={{ color: KIND_LOOK[kind].ink }}>
            {categoryLabel(kind)}
          </span>
          <span className="mod-lib-preview-title">{name.trim() || entry.name}</span>
          <Description text={description} fold />
        </div>
      </div>

      <LibraryMediaCard editing={editing} />

      <section className="mod-card" aria-label="Changes">
        <span className="mod-lib-mono mod-muted">Changes</span>
        {editing.item.status === "ready" && editing.item.data.changes.length === 0 && (
          <span className="mod-muted">Seeded, not changed since.</span>
        )}
        {editing.item.status === "ready" &&
          editing.item.data.changes.map((change) => (
            <div key={change.id} className="mod-lib-change">
              <span className="mod-lib-faint">
                {formatDate(new Date(change.changedAt), {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hourCycle: "h23",
                })}
              </span>
              <span>{change.changedBy}</span>
              <span>{changeSummary(change)}</span>
              {changeRestore(change) === "restore" && (
                <Button
                  variant="ghostOnLight"
                  size="sm"
                  onClick={() => void run(() => editing.restore(change.id))}
                  disabled={busy}
                >
                  Restore
                </Button>
              )}
              {changeRestore(change) === "permanent" && (
                <span className="mod-lib-faint">Permanent</span>
              )}
            </div>
          ))}
      </section>

      {retiring && (
        <AreaDialog
          label="Moderation"
          title={`Retire ${entry.name}?`}
          submitLabel="Retire"
          busy={busy}
          error={error}
          onClose={() => setRetiring(false)}
          onSubmit={() => void setStatus("retired")}
        >
          <p className="mod-muted">
            It leaves the library and pickers. Logs, plans and workouts that use it keep it by name.
            Unretire from the Retired filter.
          </p>
        </AreaDialog>
      )}
    </div>
  );
}
