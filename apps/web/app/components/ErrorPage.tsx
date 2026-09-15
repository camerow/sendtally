import React from "react";
import { isRouteErrorResponse, Link } from "react-router";
import { ApiError } from "@sendtally/api-client";
import { t } from "@sendtally/features/i18n";

function isNotFound(error: unknown): boolean {
  if (isRouteErrorResponse(error)) return error.status === 404;
  return error instanceof ApiError && error.status === 404;
}

/** What a route shows instead of crashing: a deleted entry, a bad link, a failed request. */
export function ErrorPage({ error }: { error: unknown }): React.ReactElement {
  const notFound = isNotFound(error);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "48px 0" }}>
      <h1
        style={{
          margin: 0,
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 28,
          letterSpacing: "-0.03em",
        }}
      >
        {notFound ? t("common.notFoundTitle") : t("common.somethingWentWrong")}
      </h1>
      <p style={{ margin: 0, fontSize: 15, color: "rgba(64,63,76,0.72)" }}>
        {notFound ? t("common.notFoundBody") : t("common.somethingWentWrongTryAgain")}
      </p>
      <Link
        to="/app"
        style={{
          alignSelf: "flex-start",
          fontFamily: "var(--font-mono)",
          fontWeight: 500,
          fontSize: 12,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "var(--text-label-accent)",
          textDecoration: "none",
        }}
      >
        ← {t("common.backToLog")}
      </Link>
    </div>
  );
}
