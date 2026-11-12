import React from "react";
import { Pressable, Text, View } from "react-native";
import type { WorkoutKind } from "@sendtally/core/hang";
import { colors } from "@sendtally/design/tokens";
import { kindLabel } from "@sendtally/features/activities";
import { pressRow } from "../../../lib/press";
import { CategoryMark } from "../library/CategoryMark";
import { KIND_LOOK } from "@sendtally/features/training";
import { type } from "../type";

export type CategoryRowProps = {
  kind: WorkoutKind;
  name: string;
  /** What follows the category on the second line, such as "3 × 8"; faded when nothing is done yet. */
  meta: string | null;
  faded?: boolean;
  /** Off where the list already names the category. */
  showKind?: boolean;
  /** Off under a heading that already carries the category's mark. */
  showMark?: boolean;
  /** Left out on a row with nowhere to go, or one inside something that presses. */
  onPress?: () => void;
};

/** A workout or exercise in a list: its category's mark, its name, and CATEGORY · meta below. */
export function CategoryRow({
  kind,
  name,
  meta,
  faded = false,
  showKind = true,
  showMark = true,
  onPress,
}: CategoryRowProps): React.ReactElement {
  const row = { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 } as const;
  const content = (
    <>
      {showMark && <CategoryMark kind={kind} size={36} />}
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text numberOfLines={1} style={[type.bodyBold, { fontSize: 15, color: colors.gunmetal }]}>
          {name}
        </Text>
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
    </>
  );
  if (onPress === undefined) return <View style={row}>{content}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={name}
      style={pressRow(row)}
    >
      {content}
    </Pressable>
  );
}
