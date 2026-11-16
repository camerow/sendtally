import React from "react";
import { Link } from "react-router";
import type { LibraryPicture, WorkoutKind } from "@sendtally/core/hang";
import { kindLabel } from "@sendtally/features/activities";
import { KIND_LOOK } from "@sendtally/features/training";
import { KindTile } from "./KindTile";

export type CategoryRowProps = {
  kind: WorkoutKind;
  name: string;
  /** What follows the category on the second line, such as "3 × 8"; faded when nothing is done yet. */
  meta: string | null;
  /** Where the row opens; none when it sits inside a row that opens something else. */
  to?: string;
  faded?: boolean;
  /** Off where the list already names the category. */
  showKind?: boolean;
  /** The built-in's first picture, as its tile; the kind's tile without one. */
  picture?: LibraryPicture;
};

/** A workout or exercise in a list: its tile, its name, and CATEGORY · meta below. */
export function CategoryRow({
  kind,
  name,
  meta,
  to,
  faded = false,
  showKind = true,
  picture,
}: CategoryRowProps): React.ReactElement {
  const rest = meta === null || meta === "" ? null : meta;
  const body = (
    <>
      <KindTile kind={kind} picture={picture} />
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
    </>
  );
  return to === undefined ? (
    <span className="category-row category-row--plain">{body}</span>
  ) : (
    <Link to={to} className="category-row">
      {body}
    </Link>
  );
}
