import React from "react";
import type { LibraryMediaRow } from "@sendtally/api-client";
import { PICTURE_TYPES, pictureProblem } from "@sendtally/core/hang";
import { Button } from "@sendtally/design";
import { formatDate, formatNumber } from "@sendtally/features/i18n";
import type { LibraryEditing } from "@sendtally/features/library";
import { AreaDialog } from "../../areas/components/AreaDialog";
import { Field } from "../../areas/components/Field";
import { inputStyle } from "../../components/styles";
import { resizedPicture } from "../resizePicture";

type Upload = {
  key: string;
  name: string;
  note: string;
  error: string | null;
  cancel?: () => void;
};

const kb = (bytes: number): string => `${formatNumber(Math.round(bytes / 1024))} KB`;

const messageOf = (e: unknown): string =>
  e instanceof Error && e.message !== "" ? e.message : "Could not upload.";

function PictureRow({
  media,
  index,
  count,
  editing,
  busy,
  onDelete,
}: {
  media: LibraryMediaRow;
  index: number;
  count: number;
  editing: LibraryEditing;
  busy: boolean;
  onDelete: () => void;
}): React.ReactElement {
  const [alt, setAlt] = React.useState(media.alt);
  const [credit, setCredit] = React.useState(media.credit);
  const [seen, setSeen] = React.useState(media);
  if (seen !== media) {
    if (seen.alt !== media.alt) setAlt(media.alt);
    if (seen.credit !== media.credit) setCredit(media.credit);
    setSeen(media);
  }
  const save = (edit: { alt?: string; credit?: string }): void => {
    if (Object.entries(edit).some(([k, v]) => media[k as "alt" | "credit"] !== v.trim()))
      void editing.editMedia(media.id, edit);
  };
  return (
    <div className="mod-lib-media">
      <img className="mod-lib-media-thumb" src={media.thumbUrl} alt="" width={72} height={72} />
      <div className="mod-lib-fields">
        <Field id={`alt-${media.id}`} label="Alt text">
          <input
            id={`alt-${media.id}`}
            value={alt}
            maxLength={300}
            onChange={(e) => setAlt(e.target.value)}
            onBlur={() => save({ alt })}
            style={inputStyle}
          />
          {alt.trim() === "" && (
            <span className="area-error">Alt text is required. Hidden in the apps until then.</span>
          )}
        </Field>
        <Field id={`credit-${media.id}`} label="Credit" optional>
          <input
            id={`credit-${media.id}`}
            value={credit}
            maxLength={120}
            placeholder="Photo by …"
            onChange={(e) => setCredit(e.target.value)}
            onBlur={() => save({ credit })}
            style={inputStyle}
          />
        </Field>
        <span className="mod-lib-faint">
          {`Picture · added ${formatDate(new Date(media.createdAt), { month: "short", day: "numeric" })} by ${media.createdBy}`}
        </span>
      </div>
      <div className="mod-actions">
        <Button
          variant="ghostOnLight"
          size="sm"
          aria-label="Move up"
          disabled={busy || index === 0}
          onClick={() => void editing.editMedia(media.id, { position: index - 1 })}
        >
          ↑
        </Button>
        <Button
          variant="ghostOnLight"
          size="sm"
          aria-label="Move down"
          disabled={busy || index === count - 1}
          onClick={() => void editing.editMedia(media.id, { position: index + 1 })}
        >
          ↓
        </Button>
        <Button variant="danger" size="sm" disabled={busy} onClick={onDelete}>
          Delete
        </Button>
      </div>
    </div>
  );
}

/** A built-in's pictures in order, each saved as it uploads or as its text loses focus. */
export function LibraryMediaCard({ editing }: { editing: LibraryEditing }): React.ReactElement {
  const input = React.useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = React.useState<Upload[]>([]);
  const [deleting, setDeleting] = React.useState<LibraryMediaRow | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const media = editing.item.status === "ready" ? editing.item.data.media : [];

  const update = (key: string, next: Partial<Upload> | null): void =>
    setUploads((all) =>
      next === null
        ? all.filter((u) => u.key !== key)
        : all.map((u) => (u.key === key ? { ...u, ...next } : u))
    );

  const add = async (file: File): Promise<void> => {
    const key = crypto.randomUUID();
    const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const problem = pictureProblem(file.type, file.size, head);
    setUploads((all) => [...all, { key, name: file.name, note: "Resizing", error: problem }]);
    if (problem !== null) return;
    const abort = new AbortController();
    try {
      const sized = await resizedPicture(file);
      update(key, {
        note: `Resized to ${formatNumber(Math.max(sized.width, sized.height))} px · ${kb(sized.picture.size)}`,
        cancel: () => abort.abort(),
      });
      await editing.addPicture(
        {
          picture: sized.picture,
          thumb: sized.thumb,
          width: String(sized.width),
          height: String(sized.height),
        },
        abort.signal
      );
      update(key, null);
    } catch (e) {
      update(key, abort.signal.aborted ? null : { error: messageOf(e), cancel: undefined });
    }
  };

  const remove = async (row: LibraryMediaRow): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      await editing.deleteMedia(row.id);
      setDeleting(null);
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mod-card" aria-label="Media">
      <div className="mod-lib-item-head">
        <span className="mod-lib-mono mod-muted">{`Media · ${formatNumber(media.length)}`}</span>
        <Button variant="azure" size="sm" onClick={() => input.current?.click()}>
          Add picture
        </Button>
        <input
          ref={input}
          type="file"
          accept={PICTURE_TYPES.join(",")}
          multiple
          hidden
          onChange={(e) => {
            for (const file of e.target.files ?? []) void add(file);
            e.target.value = "";
          }}
        />
      </div>
      {uploads.map((u) => (
        <div key={u.key} className="mod-lib-upload">
          <span className="mod-lib-name">{u.name}</span>
          {u.error === null ? (
            <>
              <span className="mod-lib-faint">{u.note}</span>
              <span
                className="mod-lib-progress"
                role="progressbar"
                aria-label={`Uploading ${u.name}`}
              />
              {u.cancel !== undefined && (
                <Button variant="ghostOnLight" size="sm" onClick={u.cancel}>
                  Cancel
                </Button>
              )}
            </>
          ) : (
            <>
              <span className="area-error" role="alert">
                {u.error}
              </span>
              <Button variant="ghostOnLight" size="sm" onClick={() => update(u.key, null)}>
                Dismiss
              </Button>
            </>
          )}
        </div>
      ))}
      {media.length === 0 && uploads.length === 0 && (
        <span className="mod-muted">No pictures. The apps show this item without one.</span>
      )}
      {media.map((m, i) => (
        <PictureRow
          key={m.id}
          media={m}
          index={i}
          count={media.length}
          editing={editing}
          busy={busy}
          onDelete={() => setDeleting(m)}
        />
      ))}
      {deleting !== null && (
        <AreaDialog
          label="Moderation"
          title="Delete this picture?"
          submitLabel="Delete"
          destructive
          busy={busy}
          error={error}
          onClose={() => setDeleting(null)}
          onSubmit={() => void remove(deleting)}
        >
          <p className="mod-muted">The file is removed for everyone and cannot be restored.</p>
        </AreaDialog>
      )}
    </section>
  );
}
