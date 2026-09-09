import React from "react";
import type { PostActionFeature, PostStatusVM } from "@sendtally/features/session-detail";

export type PostStatusBarProps = {
  post: PostStatusVM;
  action: PostActionFeature;
};

const line: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "0.06em",
};

export function PostStatusBar({ post, action }: PostStatusBarProps): React.ReactElement {
  const message = action.error ?? post.detail;
  return (
    <div
      style={{
        marginTop: 18,
        paddingTop: 14,
        borderTop: "1px solid var(--line-on-light)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
        flexWrap: "wrap",
      }}
    >
      <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span
          style={{
            ...line,
            color: post.alert ? "var(--text-label-accent)" : "rgba(64,63,76,0.55)",
          }}
        >
          {post.label}
        </span>
        {message !== null && (
          <span
            style={{
              ...line,
              fontWeight: 400,
              letterSpacing: "0.04em",
              color: "rgba(64,63,76,0.55)",
            }}
          >
            {message}
          </span>
        )}
      </span>
      {post.action !== null && (
        <button
          type="button"
          onClick={action.run}
          disabled={action.busy}
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 600,
            fontSize: 13,
            color: "rgba(64,63,76,0.72)",
            background: "none",
            border: "1px solid rgba(64,63,76,0.25)",
            borderRadius: "var(--radius-control)",
            padding: "8px 14px",
            cursor: action.busy ? "default" : "pointer",
            opacity: action.busy ? 0.55 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {action.busy ? "Posting…" : post.actionLabel}
        </button>
      )}
    </div>
  );
}
