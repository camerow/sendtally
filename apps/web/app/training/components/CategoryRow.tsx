import React from "react";
import { Link } from "react-router";
import type { WorkoutKind } from "@sendtally/core/hang";
import { kindLabel } from "@sendtally/features/activities";
import { KIND_LOOK } from "@sendtally/features/training";
import { CategoryMark } from "./CategoryMark";

export type CategoryRowProps = {
  kind: WorkoutKind;
  name: string;
  /** What follows the category on the second line, such as "3 × 8"; faded when nothing is done yet. */
  meta: string | null;
  to: string;
  faded?: boolean;
  /** Off where the list already names the category. */
  showKind?: boolean;
  /** Off under a heading that already carries the category's mark. */
  showMark?: boolean;
};

/** A workout or exercise in a list: its category's mark, its name, and CATEGORY · meta below. */
export function CategoryRow({
  kind,
  name,
  meta,
  to,
  faded = false,
  showKind = true,
  showMark = true,
}: CategoryRowProps): React.ReactElement {
  const rest = meta === null || meta === "" ? null : meta;
  return (
    <Link to={to} className="category-row">
      {showMark && <CategoryMark kind={kind} />}
      <span className="category-row-text">
        <span className="category-row-name">{name}</span>
        <span
          className={faded ? "category-row-meta category-row-meta--faded" : "category-row-meta"}
        >
          {showKind && (
            <span style={{ color: KIND_LOOK[kind].ink, textTransform: "uppercase" }}>
              {kindLabel(kind)}
            </span>
          )}
          {showKind ? (rest === null ? null : ` · ${rest}`) : rest}
        </span>
      </span>
    </Link>
  );
}
