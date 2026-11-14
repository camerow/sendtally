import React from "react";

export type PreviewRowProps = {
  title: string;
  detail: string;
  /** A muted line under it, such as what it alternates with. */
  note?: string;
  /** Its rest, muted at the end of that line. */
  rest?: string;
};

/** One line of a workout's body: what to do and how much in mono, and what else to know. */
export function PreviewRow({ title, detail, note, rest }: PreviewRowProps): React.ReactElement {
  return (
    <div className="preview-row">
      <span className="preview-row-line">
        <span className="preview-row-title">{title}</span>
        {detail !== "" && <span className="preview-row-detail">{detail}</span>}
      </span>
      {(note !== undefined || rest !== undefined) && (
        <span className="preview-row-line preview-row-note">
          <span>{note ?? ""}</span>
          {rest !== undefined && <span className="preview-row-rest">{rest}</span>}
        </span>
      )}
    </div>
  );
}
