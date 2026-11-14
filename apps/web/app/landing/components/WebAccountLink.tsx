import React from "react";
import { useLanding } from "../LandingContext";

export type WebAccountLinkProps = {
  label: string;
  tone?: "light" | "dark";
};

/** The secondary call to action: a web account, for anyone not reaching for the stores. */
export function WebAccountLink({ label, tone = "light" }: WebAccountLinkProps): React.ReactElement {
  const { signedIn, copy } = useLanding();
  return (
    <a
      href={signedIn ? "/app" : "/sign-up"}
      className={tone === "dark" ? "l-textlink l-textlink--dark" : "l-textlink"}
    >
      {signedIn ? copy.nav.openApp : label}
    </a>
  );
}
