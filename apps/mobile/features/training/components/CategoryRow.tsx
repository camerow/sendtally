import React from "react";
import { Pressable, Text, View } from "react-native";
import type { LibraryPicture, WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { kindLabel } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { Lock } from "../../../components/Lock";
import { pressRow } from "../../../lib/press";
import { KIND_LOOK } from "@sendtally/features/training";
import { type } from "../type";
import { holdProps } from "./holdProps";
import { KindTile } from "./KindTile";
import type { LongPress } from "./types";

export type CategoryRowProps = {
  kind: WorkoutKind;
  name: string;
  /** What follows the category on the second line, such as "3 × 8"; faded when nothing is done yet. */
  meta: string | null;
  faded?: boolean;
  /** Off where the list already names the category. */
  showKind?: boolean;
  /** The built-in's first picture, as its tile; the kind's tile without one. */
  picture?: LibraryPicture;
  /** Left out on a row with nowhere to go, or one inside something that presses. */
  onPress?: () => void;
  /** Members only: the name muted and the lock at the trailing edge. */
  locked?: boolean;
  hold?: LongPress;
  /** Beside the name, such as the Yours tag. */
  tag?: React.ReactNode;
};

/** A workout or exercise in a list: its tile, its name, and CATEGORY · meta below. */
export function CategoryRow({
  kind,
  name,
  meta,
  faded = false,
  showKind = true,
  picture,
  onPress,
  locked = false,
  hold,
  tag,
}: CategoryRowProps): React.ReactElement {
  const row = { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 } as const;
  const content = (
    <>
      <KindTile kind={kind} picture={picture} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text
            numberOfLines={1}
            style={[
              type.bodyBold,
              { flexShrink: 1, fontSize: 15, color: locked ? colors.textMuted : colors.gunmetal },
            ]}
          >
            {name}
          </Text>
          {tag}
        </View>
        <Text
          numberOfLines={1}
          style={[
            type.mono,
            { fontSize: 11.5, color: faded ? colors.textMuted : colors.textSecondary },
          ]}
        >
          {showKind && (
            <Text style={{ color: KIND_LOOK[kind].ink, textTransform: "uppercase" }}>
              {kindLabel(kind)}
            </Text>
          )}
          {showKind ? (meta === null || meta === "" ? null : ` · ${meta}`) : meta}
        </Text>
      </View>
      {locked && <Lock />}
    </>
  );
  if (onPress === undefined) return <View style={row}>{content}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={locked ? t("common.membersOnly", { label: name }) : name}
      {...holdProps(hold)}
      style={pressRow(row)}
    >
      {content}
    </Pressable>
  );
}
