import React from "react";
import { isRouteErrorResponse, useLocation } from "react-router";
import { ApiError } from "@sendtally/api-client";
import { Button } from "@sendtally/design";
import { t, type MessageKey } from "@sendtally/features/i18n";

type Kind = "notFound" | "forbidden" | "server";

const COPY: Record<Kind, { label: MessageKey; title: MessageKey; body: MessageKey }> = {
  notFound: {
    label: "common.notFoundLabel",
    title: "common.notFoundTitle",
    body: "common.notFoundBody",
  },
  forbidden: {
    label: "common.forbiddenLabel",
    title: "common.forbiddenTitle",
    body: "common.forbiddenBody",
  },
  server: {
    label: "common.serverErrorLabel",
    title: "common.serverErrorTitle",
    body: "common.serverErrorBody",
  },
};

function statusOf(error: unknown): number | null {
  if (isRouteErrorResponse(error)) return error.status;
  if (error instanceof ApiError) return error.status;
  return null;
}

function kindOf(status: number | null): Kind {
  if (status === 404) return "notFound";
  if (status === 401 || status === 403) return "forbidden";
  return "server";
}

/** The logo glyph carried further: holds on a line, and the one that is missing says why. */
function RouteArt({ kind }: { kind: Kind }): React.ReactElement {
  const hold = { fill: "var(--bs-gunmetal)" };
  const lost = { fill: "none", stroke: "var(--line-on-light-strong)", strokeWidth: 2 };
  const line = {
    fill: "none",
    stroke: "var(--bs-gunmetal)",
    strokeWidth: 3,
    strokeLinecap: "round" as const,
  };
  const broken = { ...line, stroke: "var(--line-on-light-strong)", strokeDasharray: "2 9" };
  return (
    <svg viewBox="0 0 120 120" width={176} height={176} aria-hidden="true" style={{ flex: "none" }}>
      {kind === "server" ? (
        <>
          <path d="M28 98 L56 64" style={line} />
          <path d="M76 80 L100 52" style={broken} />
          <circle cx="28" cy="98" r="8" style={hold} />
          <circle cx="56" cy="64" r="8" style={hold} />
          <circle cx="76" cy="80" r="8" style={lost} />
          <circle cx="100" cy="52" r="8" style={lost} />
        </>
      ) : (
        <>
          <path d="M28 98 L60 60" style={line} />
          <path d="M60 60 L92 22" style={kind === "notFound" ? broken : line} />
          <circle cx="28" cy="98" r="8" style={hold} />
          <circle cx="60" cy="60" r="8" style={hold} />
          <circle cx="92" cy="22" r="8" style={kind === "notFound" ? lost : hold} />
          {kind === "forbidden" && (
            <path
              d="M34 40 L98 76"
              style={{
                stroke: "var(--bs-watermelon-ink)",
                strokeWidth: 3,
                strokeLinecap: "round",
              }}
            />
          )}
        </>
      )}
    </svg>
  );
}

function Actions({ kind }: { kind: Kind }): React.ReactElement {
  const backToLog = (
    <Button variant="gold" size="sm" href="/app">
      {t("common.backToLog")}
    </Button>
  );
  if (kind === "server") {
    return (
      <>
        <Button variant="gold" size="sm" onClick={() => window.location.reload()}>
          {t("common.tryAgain")}
        </Button>
        <Button variant="ghostOnLight" size="sm" href="/app">
          {t("common.backToLog")}
        </Button>
      </>
    );
  }
  if (kind === "forbidden") {
    return (
      <>
        {backToLog}
        <Button variant="ghostOnLight" size="sm" href="/sign-in">
          {t("common.switchAccount")}
        </Button>
      </>
    );
  }
  return (
    <>
      {backToLog}
      <Button variant="ghostOnLight" size="sm" href="/app/sessions/new">
        {t("common.logASession")}
      </Button>
    </>
  );
}

/** What a route shows instead of crashing: a deleted entry, a bad link, a failed request. */
export function ErrorPage({ error }: { error: unknown }): React.ReactElement {
  const status = statusOf(error);
  const kind = kindOf(status);
  const { pathname } = useLocation();
  const copy = COPY[kind];
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 40,
        padding: "48px 0",
      }}
    >
      <div style={{ flex: "1 1 280px", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              fontSize: 13,
              letterSpacing: "0.14em",
              padding: "3px 8px",
              borderRadius: "var(--radius-sm)",
              background: "var(--bs-gold)",
            }}
          >
            {status ?? 500}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "rgba(64,63,76,0.45)",
            }}
          >
            {t(copy.label)}
          </span>
        </div>
        <h1
          style={{
            margin: "0 0 12px",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 36,
            lineHeight: 1.02,
            letterSpacing: "-0.035em",
            textWrap: "balance",
          }}
        >
          {t(copy.title)}
        </h1>
        <p
          style={{
            margin: 0,
            maxWidth: "44ch",
            fontSize: 15.5,
            lineHeight: 1.55,
            color: "var(--text-on-white-secondary)",
          }}
        >
          {t(copy.body)}
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 10,
            marginTop: 24,
          }}
        >
          <Actions kind={kind} />
        </div>
        <div
          style={{
            marginTop: 22,
            paddingTop: 14,
            borderTop: "1px solid var(--line-on-light-soft)",
            fontFamily: "var(--font-mono)",
            fontSize: 11.5,
            color: "rgba(64,63,76,0.55)",
          }}
        >
          {pathname}
        </div>
      </div>
      <RouteArt kind={kind} />
    </div>
  );
}
