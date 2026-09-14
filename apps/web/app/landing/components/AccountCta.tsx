import React from "react";
import { Button, type ButtonProps } from "@sendtally/design";
import { useLanding } from "../LandingContext";

export type AccountCtaProps = {
  label: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
};

export function AccountCta({
  label,
  variant = "gold",
  size = "md",
  className,
}: AccountCtaProps): React.ReactElement {
  const { signedIn, copy } = useLanding();
  return (
    <Button
      variant={variant}
      size={size}
      href={signedIn ? "/app" : "/sign-up"}
      className={className}
    >
      {signedIn ? copy.nav.openApp : label}
    </Button>
  );
}
