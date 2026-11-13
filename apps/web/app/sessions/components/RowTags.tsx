import React from "react";
import type { SessionTag } from "@sendtally/api-client";

/** A row's tags, display only. */
export function RowTags({ tags }: { tags: readonly SessionTag[] }): React.ReactElement | null {
  if (tags.length === 0) return null;
  return (
    <span className="row-tags">
      {tags.map((tag) => (
        <span key={tag.id} className="row-tag">
          {tag.name}
        </span>
      ))}
    </span>
  );
}
