import React from "react";

/** A note, shaped like a history row: its date, an optional title, and the text. Click opens it. */
export function NoteRow({
  date,
  title,
  body,
  onPress,
}: {
  date: string;
  title?: string | null;
  body: string;
  onPress: () => void;
}): React.ReactElement {
  return (
    <button type="button" className="history-row history-row--link note-row" onClick={onPress}>
      <span className="history-date">{date}</span>
      <span className="history-main">
        {title != null && title !== "" && <span className="history-name">{title}</span>}
        {body !== "" && <span className="note-row-body">{body}</span>}
      </span>
    </button>
  );
}
