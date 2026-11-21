import React from "react";
import { Text, View } from "react-native";
import { colors, fonts, radius } from "@sendtally/design/tokens";

/** Small mono text on the dark ground: a card's meta, a tile's word, the next-step note. */
export const darkMeta = {
  fontFamily: fonts.mono,
  fontSize: 12,
  lineHeight: 17,
  color: "rgba(255,255,255,0.75)",
} as const;

export const darkLabel = {
  fontFamily: fonts.monoMedium,
  fontSize: 10,
  letterSpacing: 0.8,
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.7)",
} as const;

export type DarkCardProps = {
  label: string;
  /** Right of the label: what the card counts so far. */
  meta?: string;
  /** Under a rule at the foot: what the next action adds. */
  note?: React.ReactNode;
  /** Keeps the note's line when it goes, so nothing under the card moves under the finger. */
  reserveNote?: boolean;
  /** Lifted off the form it is pinned above. */
  raised?: boolean;
  children?: React.ReactNode;
};

/** The wizard's payoff card: on the app's dark ground, what the step has made so far. */
export function DarkCard({
  label,
  meta,
  note,
  reserveNote = false,
  raised = false,
  children,
}: DarkCardProps): React.ReactElement {
  return (
    <View
      style={{
        gap: 12,
        padding: 16,
        borderRadius: radius.panel,
        backgroundColor: colors.gunmetal,
        ...(raised
          ? {
              shadowColor: "#000",
              shadowOpacity: 0.35,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 8 },
              elevation: 6,
            }
          : {}),
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <Text style={darkLabel}>{label}</Text>
        {meta !== undefined && meta !== "" && (
          <Text numberOfLines={1} style={darkMeta}>
            {meta}
          </Text>
        )}
      </View>
      {children}
      {(note !== undefined || reserveNote) && (
        <Text
          accessibilityElementsHidden={note === undefined}
          style={{
            ...darkMeta,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: note === undefined ? "transparent" : "rgba(255,255,255,0.12)",
          }}
        >
          {note ?? " "}
        </Text>
      )}
    </View>
  );
}
