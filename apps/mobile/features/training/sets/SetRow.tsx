import React from "react";
import { Pressable, Text, View } from "react-native";
import { colors } from "@sendtally/design/tokens";
import { Icon } from "../../../components/Icon";
import { press } from "../../../lib/press";
import { CheckBox } from "../components/CheckBox";
import { type } from "../type";
import { SET_COLUMNS } from "./setColumns";

export type SetRowProps = {
  /** Its place, quietest in the row: "1", "B2", "Lap 3"; "" for a checklist line, which has none. */
  position: string;
  /** A superset member's or a climb's name, on its own line over the row. */
  name?: string;
  /** The row's fields or a kind's content, filling the grid after the position. */
  children: React.ReactNode;
  /** The RPE column, for a block that asks a set RPE: null keeps the column empty. Read mode widens it for a mark. */
  rpe?: React.ReactElement | null;
  /** Edit: the tick, or `trailing` in its place. Read: values as text, nothing trailing. */
  mode?: "edit" | "read";
  ticked?: boolean;
  onToggle?: () => void;
  /** In place of the tick, such as Start lap. */
  trailing?: React.ReactNode;
  /** Names the set for screen readers: its tick and its select. */
  label: string;
  selected?: boolean;
  /** Pressing the position, or the name line, selects the row; pressing a selected name unselects. */
  onSelect?: () => void;
  /** Takes the row out: shown in place of the position while selected. */
  onRemove?: () => void;
  removeLabel?: string;
  testID?: string;
};

/** One row of the set grid, in the run, the review and the finished workout. */
export function SetRow({
  position,
  name,
  children,
  rpe,
  mode = "edit",
  ticked = false,
  onToggle,
  trailing,
  label,
  selected = false,
  onSelect,
  onRemove,
  removeLabel,
  testID,
}: SetRowProps): React.ReactElement {
  const read = mode === "read";
  const removing = selected && onRemove !== undefined;
  const place = removing ? (
    <Pressable
      onPress={onRemove}
      accessibilityRole="button"
      accessibilityLabel={removeLabel ?? label}
      hitSlop={{ top: 10, bottom: 10, left: 6 }}
      style={press([SET_COLUMNS.position, { paddingLeft: 3 }])}
    >
      <Icon name="minusCircle" color={colors.watermelonInk} size={24} strokeWidth={1.5} />
    </Pressable>
  ) : (
    <Pressable
      onPress={name === undefined ? onSelect : undefined}
      disabled={name !== undefined || onSelect === undefined}
      accessibilityRole={name === undefined && onSelect !== undefined ? "button" : undefined}
      accessibilityState={{ selected }}
      hitSlop={{ top: 12, bottom: 12, left: 6 }}
      style={SET_COLUMNS.position}
    >
      <Text style={[type.mono, { fontSize: 12, color: colors.textMuted }]}>{position}</Text>
    </Pressable>
  );
  return (
    <View
      testID={testID}
      style={{ borderRadius: 10, backgroundColor: selected ? colors.surfaceSoft : undefined }}
    >
      {name !== undefined && (
        <Pressable
          onPress={onSelect}
          disabled={onSelect === undefined}
          accessibilityRole={onSelect === undefined ? undefined : "button"}
          accessibilityLabel={name}
          accessibilityState={{ selected }}
          style={[
            SET_COLUMNS.row,
            { alignItems: removing ? "center" : "baseline", paddingTop: read ? 6 : 11 },
          ]}
        >
          {place}
          <Text style={[type.bodyBold, { flex: 1, fontSize: 15, color: colors.gunmetal }]}>
            {name}
          </Text>
        </Pressable>
      )}
      <View style={[SET_COLUMNS.row, { minHeight: read ? 30 : 48 }]}>
        {position !== "" && (name === undefined ? place : <View style={SET_COLUMNS.position} />)}
        <View style={SET_COLUMNS.lead}>{children}</View>
        {rpe !== undefined && (
          <View style={read ? SET_COLUMNS.rpeRead : SET_COLUMNS.rpe}>{rpe}</View>
        )}
        {!read &&
          (trailing ?? (
            <Pressable
              onPress={onToggle}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: ticked }}
              accessibilityLabel={label}
              style={press(SET_COLUMNS.tick)}
            >
              <CheckBox checked={ticked} color={colors.fern} />
            </Pressable>
          ))}
      </View>
    </View>
  );
}
