import React from "react";

/** The shell every queue item sits in: a kicker line, the body, then its buttons. */
export function ModCard({
  kicker,
  actions,
  error,
  children,
}: {
  kicker: React.ReactNode;
  actions: React.ReactNode;
  error: string | null;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <article className="mod-card">
      <span className="area-meta">{kicker}</span>
      {children}
      {error !== null && (
        <span className="area-error" role="alert">
          {error}
        </span>
      )}
      <div className="mod-actions">{actions}</div>
    </article>
  );
}
