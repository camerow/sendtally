import React from "react";
import { Button, type ButtonProps } from "@sendtally/design";
import { COPY } from "../copy";
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
  const { signedIn } = useLanding();
  return (
    <Button
      variant={variant}
      size={size}
      href={signedIn ? "/app" : "/sign-up"}
      className={className}
    >
      {signedIn ? COPY.nav.openApp : label}
    </Button>
  );
}
