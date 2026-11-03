import React from "react";
import { Pressable, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { pressRow } from "../lib/press";
import { Icon } from "./Icon";

const GUTTER = 18;

export type ExpandableRowProps = {
  expanded: boolean;
  onToggle: () => void;
  accessibilityLabel: string;
  /** What the row shows, left of its chevron. */
  children: React.ReactNode;
  /** What opens under it, lined up with the row's text. */
  body: React.ReactNode;
  indent: number;
};

/** A list row edge to edge that opens in place: a soft fill and the chevron turned down while open. */
export function ExpandableRow({
  expanded,
  onToggle,
  accessibilityLabel,
  children,
  body,
  indent,
}: ExpandableRowProps): React.ReactElement {
  return (
    <>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={accessibilityLabel}
        style={pressRow({
          minHeight: 52,
          marginHorizontal: -GUTTER,
          paddingHorizontal: GUTTER,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.lineOnLightSoft,
          backgroundColor: expanded ? colors.surfaceSoft : undefined,
        })}
      >
        <View style={{ flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 12 }}>
          {children}
        </View>
        <View style={{ transform: [{ rotate: expanded ? "90deg" : "0deg" }] }}>
          <Icon name="chevron" color={colors.textSecondary} size={18} />
        </View>
      </Pressable>
      {expanded && <View style={{ paddingLeft: indent }}>{body}</View>}
    </>
  );
}
