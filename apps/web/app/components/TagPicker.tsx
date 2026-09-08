import React from "react";
import type { TagOption } from "@sendtally/features/sessions";
import { chipStyle } from "./chip";

export type TagPickerProps = {
  tags: string[];
  suggestions: TagOption[];
  placeholder?: string;
  disabled?: boolean;
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
};

const columnHead: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 10,
  letterSpacing: "0.08em",
  color: "rgba(64,63,76,0.55)",
};

const MAX_SUGGESTIONS = 8;

export function TagPicker({
  tags,
  suggestions,
  placeholder = "Add a tag",
  disabled = false,
  onAdd,
  onRemove,
}: TagPickerProps): React.ReactElement {
  const [entry, setEntry] = React.useState("");

  function commit(): void {
    onAdd(entry);
    setEntry("");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {tags.map((tag) => (
          <span
            key={tag}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "var(--font-mono)",
              fontWeight: 500,
              fontSize: 11,
              letterSpacing: "0.06em",
              padding: "7px 8px 7px 12px",
              borderRadius: "var(--radius-pill)",
              background: "rgba(204,121,234,0.14)",
              color: "var(--bs-gunmetal)",
            }}
          >
            {tag.toUpperCase()}
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              disabled={disabled}
              onClick={() => onRemove(tag)}
              style={{
                border: "none",
                background: "none",
                cursor: disabled ? "default" : "pointer",
                padding: 0,
                fontSize: 12,
                lineHeight: 1,
                color: "rgba(64,63,76,0.55)",
              }}
            >
              ✕
            </button>
          </span>
        ))}
        <input
          value={entry}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => setEntry(e.target.value)}
          onBlur={() => entry.trim() !== "" && commit()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit();
            }
            if (e.key === "Backspace" && entry === "" && tags.length > 0) {
              onRemove(tags[tags.length - 1]!);
            }
          }}
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 14,
            color: "var(--bs-gunmetal)",
            background: "var(--bs-white)",
            border: "1px solid rgba(64,63,76,0.15)",
            borderRadius: "var(--radius-control)",
            padding: "9px 12px",
            outline: "none",
            width: 200,
            maxWidth: "100%",
          }}
        />
      </div>
      {suggestions.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={columnHead}>RECENT</span>
          {suggestions.slice(0, MAX_SUGGESTIONS).map((option) => (
            <button
              key={option.slug}
              type="button"
              disabled={disabled}
              onClick={() => onAdd(option.name)}
              style={chipStyle(false, { fontSize: 10, padding: "6px 11px" })}
            >
              + {option.name.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
