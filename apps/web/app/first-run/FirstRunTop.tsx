import type React from "react";
import { Logo } from "@sendtally/design";

/** First run's bar: the logo home, and on the right what the page offers to move on. */
export function FirstRunTop({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <header className="first-run-top">
      <a href="/" className="first-run-logo">
        <Logo tone="on-light" size={24} />
      </a>
      <span className="first-run-top-side">{children}</span>
    </header>
  );
}
