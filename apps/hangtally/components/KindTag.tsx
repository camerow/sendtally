import React from "react";
import type { HangKind } from "@sendtally/core/hang";
import { useTheme } from "../theme/ThemeContext";
import { Label } from "./Label";

export type KindTagProps = { kind: HangKind; label: string; small?: boolean };

/** Hang in the accent, Ground pull in the rest colour. */
export function KindTag({ kind, label, small }: KindTagProps): React.ReactElement {
  const c = useTheme();
  return (
    <Label
      small={small}
      color={c.ground}
      style={{
        paddingHorizontal: small ? 6 : 8,
        paddingVertical: small ? 3 : 4,
        borderRadius: small ? 4 : 6,
        overflow: "hidden",
        backgroundColor: kind === "hang" ? c.accent : c.rest,
      }}
    >
      {label}
    </Label>
  );
}
