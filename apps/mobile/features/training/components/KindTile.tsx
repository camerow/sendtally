import React from "react";
import { Image } from "react-native";
import type { LibraryPicture, WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { KIND_LOOK } from "@sendtally/features/training";
import { CategoryMark } from "../library/CategoryMark";

export type KindTileProps = { kind: WorkoutKind; picture?: LibraryPicture };

const SIZE = 44;

/**
 * A list row's leading tile: the item's first picture inside its kind's ink, or the kind's tint
 * and mark when it has none or the picture cannot load.
 */
export function KindTile({ kind, picture }: KindTileProps): React.ReactElement {
  const [failed, setFailed] = React.useState(false);
  if (picture === undefined || failed) return <CategoryMark kind={kind} size={SIZE} radius={10} />;
  return (
    <Image
      source={{ uri: picture.thumbUrl }}
      onError={() => setFailed(true)}
      accessibilityIgnoresInvertColors
      style={{
        width: SIZE,
        height: SIZE,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: KIND_LOOK[kind].ink,
        backgroundColor: colors.surfaceSoft,
      }}
    />
  );
}
