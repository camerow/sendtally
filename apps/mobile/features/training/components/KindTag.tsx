import React from "react";
import { colors } from "@sendtally/design/tokens";
import { Label } from "./Label";

export type KindTagProps = { label: string; small?: boolean };

/** A hangboard workout's kind, in the hangboard petal. */
export function KindTag({ label, small }: KindTagProps): React.ReactElement {
  return (
    <Label
      small
      color={colors.petalInk}
      style={{
        paddingHorizontal: small ? 6 : 8,
        paddingVertical: small ? 3 : 4,
        borderRadius: small ? 4 : 6,
        overflow: "hidden",
        backgroundColor: colors.petalTint,
      }}
    >
      {label}
    </Label>
  );
}
