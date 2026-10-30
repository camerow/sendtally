import React from "react";
import { Label } from "./Label";

export type KindTagProps = { label: string; color: string; background: string; small?: boolean };

/** A short label on a tinted chip. */
export function KindTag({ label, color, background, small }: KindTagProps): React.ReactElement {
  return (
    <Label
      small
      color={color}
      style={{
        paddingHorizontal: small ? 6 : 8,
        paddingVertical: small ? 3 : 4,
        borderRadius: small ? 4 : 6,
        overflow: "hidden",
        backgroundColor: background,
      }}
    >
      {label}
    </Label>
  );
}
