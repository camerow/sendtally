import React from "react";
import { Link } from "react-router";
import type { WorkoutKind } from "@sendtally/core/hang";
import { kindLabel } from "@sendtally/features/activities";
import { KIND_LOOK } from "@sendtally/features/training";
import { CategoryMark } from "./CategoryMark";

export type CategoryRowProps = {
  kind: WorkoutKind;
  name: string;
  /** What follows the category on the second line, such as "3 × 8". */
  meta: string | null;
  to: string;
};

/** A workout in a list: its category's mark, its name, and CATEGORY · meta below. */
export function CategoryRow({ kind, name, meta, to }: CategoryRowProps): React.ReactElement {
  return (
    <Link to={to} className="category-row">
      <CategoryMark kind={kind} />
      <span className="category-row-text">
        <span className="category-row-name">{name}</span>
        <span className="category-row-meta">
          <span style={{ color: KIND_LOOK[kind].ink, textTransform: "uppercase" }}>
            {kindLabel(kind)}
          </span>
          {meta === null || meta === "" ? null : ` · ${meta}`}
        </span>
      </span>
    </Link>
  );
}
