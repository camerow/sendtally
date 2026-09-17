import React from "react";
import { Text } from "react-native";
import { entryKindLabel, type EntryKind } from "@sendtally/features/journal";
import { colors, fonts, radius } from "@sendtally/design/tokens";

const LOOKS: Record<EntryKind | "status", { bg: string; border: string; color: string }> = {
  journal: { bg: "transparent", border: colors.lineOnLightStrong, color: colors.textSecondary },
  trip: { bg: "rgba(204,121,234,0.18)", border: "transparent", color: colors.petalInk },
  injury: { bg: "transparent", border: "rgba(196,48,61,0.45)", color: colors.watermelonInk },
  status: { bg: "rgba(64,63,76,0.06)", border: "transparent", color: colors.gunmetal },
};

export function EntryKindChip({
  kind,
  label,
  bg,
}: {
  kind: EntryKind | "status";
  label?: string;
  /** A fill for the chip where the kind's own tint would sit on a tinted surface. */
  bg?: string;
}): React.ReactElement {
  const look = LOOKS[kind];
  return (
    <Text
      style={{
        fontFamily: fonts.monoMedium,
        fontSize: 9,
        lineHeight: 12,
        letterSpacing: 0.7,
        textTransform: "uppercase",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radius.pill,
        borderWidth: 1,
        overflow: "hidden",
        backgroundColor: bg ?? look.bg,
        borderColor: look.border,
        color: look.color,
      }}
    >
      {label ?? (kind === "status" ? "" : entryKindLabel(kind))}
    </Text>
  );
}
