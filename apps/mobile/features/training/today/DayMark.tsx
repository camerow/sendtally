import React from "react";
import { View } from "react-native";
import type { DayItemKind } from "@sendtally/features/training";
import { KIND_LOOK } from "./kindLook";

export type DayMarkProps = { kind: DayItemKind; filled: boolean; onDark?: boolean };

/** A day item as a dot: filled once logged, outlined while planned. */
export function DayMark({ kind, filled, onDark = false }: DayMarkProps): React.ReactElement {
  const look = KIND_LOOK[kind];
  const color = onDark ? look.onDark : look.ink;
  return (
    <View
      style={{
        width: 8,
        height: 8,
        borderRadius: look.round ? 4 : 2,
        ...(filled ? { backgroundColor: color } : { borderWidth: 1.5, borderColor: color }),
      }}
    />
  );
}
