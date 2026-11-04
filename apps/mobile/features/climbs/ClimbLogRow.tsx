import { router } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import type { ClimbLogRowVM } from "@sendtally/features/climbs";
import type { CircuitColour } from "@sendtally/features/gyms";
import { colors, fonts } from "@sendtally/design/tokens";
import { pressRow } from "../../lib/press";
import { ClimbPill } from "./ClimbPill";
import { GradeBadge } from "./GradeBadge";

export type ClimbLogRowProps = {
  /** A row with no climb (`id` null) has no page: it reads as text, its name muted. */
  row: Omit<ClimbLogRowVM, "id" | "pill"> & {
    id: string | null;
    pill: ClimbLogRowVM["pill"] | null;
    /** A circuit climb's colour, which fills its grade badge. */
    colour?: CircuitColour | undefined;
  };
  /** Off under a heading that already names the grade. */
  showGrade?: boolean;
  /** Replaces opening the climb; null for a row with nowhere to go. */
  onPress?: (() => void) | null;
  /** Under the row, as a circuit's laps. */
  children?: React.ReactNode;
};

/** One climb in the log: its grade, name, crag and when, and how it went. */
export function ClimbLogRow({
  row,
  showGrade = true,
  onPress,
  children,
}: ClimbLogRowProps): React.ReactElement {
  const id = row.id;
  const open =
    onPress !== undefined
      ? onPress
      : id === null
        ? null
        : () => router.push({ pathname: "/climb/[id]", params: { id } });
  const pill = row.pill;
  const count = (row.count ?? 1) > 1 ? row.count : undefined;
  const name = count === undefined ? row.name : `${row.name} ×${count}`;
  const line = (
    <Pressable
      onPress={open ?? undefined}
      disabled={open === null}
      accessibilityRole={open === null ? "text" : "button"}
      accessibilityLabel={[row.gradeLabel, name, row.meta, pill?.label]
        .filter((part) => part !== undefined && part !== "")
        .join(", ")}
      style={pressRow({
        minHeight: 60,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        ...(children === undefined
          ? { borderBottomWidth: 1, borderBottomColor: colors.lineOnLightSoft }
          : {}),
      })}
    >
      {showGrade && <GradeBadge label={row.gradeLabel} colour={row.colour} />}
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: id === null ? fonts.sansMedium : fonts.sansSemiBold,
            fontSize: 15,
            color: id === null ? colors.textSecondary : colors.gunmetal,
          }}
        >
          {row.name}
          {count !== undefined && (
            <Text style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.textSecondary }}>
              {` ×${count}`}
            </Text>
          )}
        </Text>
        {row.meta !== "" && (
          <Text
            numberOfLines={1}
            style={{ fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSecondary }}
          >
            {row.meta}
          </Text>
        )}
      </View>
      {pill !== null && <ClimbPill kind={pill.kind} label={pill.label} />}
    </Pressable>
  );
  if (children === undefined) return line;
  return (
    <View
      style={{ paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.lineOnLightSoft }}
    >
      {line}
      <View style={{ paddingLeft: 64 }}>{children}</View>
    </View>
  );
}
