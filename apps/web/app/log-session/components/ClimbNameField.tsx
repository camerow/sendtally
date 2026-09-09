import React from "react";
import type { ClimbSummary } from "@sendtally/api-client";
import { climbDraftGrade } from "@sendtally/features/climbs";
import type { GradeScale } from "@sendtally/features/log-session";
import { Glyph } from "./Glyph";
import { FLAG, columnHead, inputStyle } from "./styles";

export type ClimbNameFieldProps = {
  value: string;
  scale: GradeScale;
  suggestions: ClimbSummary[];
  inline?: boolean;
  autoFocus?: boolean;
  onChange: (name: string) => void;
  onPick: (climb: ClimbSummary) => void;
};

const rowStyle = (active: boolean): React.CSSProperties => ({
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "0.06em",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  height: 36,
  padding: "0 10px",
  borderRadius: "var(--radius-sm)",
  background: active ? "var(--surface-soft)" : "transparent",
  color: "var(--bs-gunmetal)",
  cursor: "pointer",
});

function MarkedName({ name, query }: { name: string; query: string }): React.ReactElement {
  const upper = name.toUpperCase();
  const needle = query.trim().toUpperCase();
  const at = needle === "" ? -1 : upper.indexOf(needle);
  if (at < 0) return <span>{upper}</span>;
  return (
    <span>
      {upper.slice(0, at)}
      <span style={{ fontWeight: 600, color: "var(--bs-petal-ink)" }}>
        {upper.slice(at, at + needle.length)}
      </span>
      {upper.slice(at + needle.length)}
    </span>
  );
}

export function ClimbNameField({
  value,
  scale,
  suggestions,
  inline = false,
  autoFocus = false,
  onChange,
  onPick,
}: ClimbNameFieldProps): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const highlighted = Math.min(active, Math.max(suggestions.length - 1, 0));
  const showList = open && suggestions.length > 0;

  function pick(climb: ClimbSummary): void {
    onPick(climb);
    setOpen(false);
    setActive(0);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setActive((i) =>
        e.key === "ArrowDown" ? Math.min(i + 1, suggestions.length - 1) : Math.max(i - 1, 0)
      );
      return;
    }
    if (e.key === "Enter" && showList) {
      const choice = suggestions[highlighted];
      if (choice === undefined) return;
      e.preventDefault();
      pick(choice);
      return;
    }
    if (e.key === "Escape") setOpen(false);
  }

  const list = showList && (
    <div
      role="listbox"
      onMouseDown={(e) => e.preventDefault()}
      className={inline ? "climb-name-list climb-name-list--inline" : "climb-name-list"}
    >
      {value.trim() === "" && (
        <span style={{ ...columnHead, padding: "6px 10px 4px" }}>RECENT</span>
      )}
      {suggestions.map((climb, i) => (
        <div
          key={climb.slug}
          role="option"
          aria-selected={i === highlighted}
          onMouseEnter={() => setActive(i)}
          onClick={() => pick(climb)}
          style={rowStyle(i === highlighted)}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, minWidth: 0 }}>
            {climb.project && <Glyph d={FLAG} size={11} width={1.8} filled />}
            <MarkedName name={climb.name} query={value} />
          </span>
          <span style={{ color: "rgba(64,63,76,0.55)", flex: "none" }}>
            {climbDraftGrade(climb, scale)}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div
      style={{
        position: "relative",
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <input
        value={value}
        placeholder="Name (optional)"
        autoComplete="off"
        autoFocus={autoFocus}
        role="combobox"
        aria-expanded={showList}
        aria-autocomplete="list"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className="log-session-control"
        style={{
          ...inputStyle,
          ...(open ? { borderColor: "var(--bs-azure)", boxShadow: "var(--focus-ring-azure)" } : {}),
        }}
      />
      {list}
    </div>
  );
}
