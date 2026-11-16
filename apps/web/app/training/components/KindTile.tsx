import React from "react";
import type { LibraryPicture } from "@sendtally/api-client";
import type { WorkoutKind } from "@sendtally/core/hang";
import { KIND_LOOK } from "@sendtally/features/training";
import { CategoryMark } from "./CategoryMark";

export type KindTileProps = { kind: WorkoutKind; picture?: LibraryPicture };

/**
 * A list row's leading tile: the item's first picture inside its kind's ink, or the kind's tint
 * and mark when it has none or the picture cannot load.
 */
export function KindTile({ kind, picture }: KindTileProps): React.ReactElement {
  const [failed, setFailed] = React.useState(false);
  if (picture === undefined || failed) return <CategoryMark kind={kind} size={44} radius={10} />;
  return (
    <img
      src={picture.thumbUrl}
      alt=""
      width={44}
      height={44}
      onError={() => setFailed(true)}
      style={{
        flex: "none",
        boxSizing: "border-box",
        objectFit: "cover",
        borderRadius: 10,
        border: `2px solid ${KIND_LOOK[kind].ink}`,
        background: "var(--surface-soft)",
      }}
    />
  );
}
