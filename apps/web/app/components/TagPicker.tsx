import React from "react";
import { tagMatches, type TagOption } from "@sendtally/features/sessions";

export type TagPickerProps = {
  tags: string[];
  suggestions: TagOption[];
  placeholder?: string;
  disabled?: boolean;
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
};

const mono: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "0.06em",
};

const columnHead: React.CSSProperties = {
  ...mono,
  fontSize: 10,
  letterSpacing: "0.08em",
  color: "rgba(64,63,76,0.55)",
  padding: "6px 10px 4px",
};

const rowStyle = (active: boolean): React.CSSProperties => ({
  ...mono,
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

function Cross(): React.ReactElement {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M2 2l6 6M8 2l-6 6" />
    </svg>
  );
}

function Plus(): React.ReactElement {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M5 1.5v7M1.5 5h7" />
    </svg>
  );
}

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

export function TagPicker({
  tags,
  suggestions,
  placeholder = "Add a tag",
  disabled = false,
  onAdd,
  onRemove,
}: TagPickerProps): React.ReactElement {
  const [entry, setEntry] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const { options, create } = tagMatches(suggestions, entry);
  const rows = [...options.map((o) => o.name), ...(create === null ? [] : [create])];
  const highlighted = Math.min(active, Math.max(rows.length - 1, 0));

  function pick(name: string): void {
    onAdd(name);
    setEntry("");
    setActive(0);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setActive((i) =>
        e.key === "ArrowDown" ? Math.min(i + 1, rows.length - 1) : Math.max(i - 1, 0)
      );
      return;
    }
    if (e.key === "Enter" || e.key === "," || (e.key === "Tab" && entry !== "")) {
      const choice = rows[highlighted];
      if (choice === undefined) return;
      e.preventDefault();
      pick(choice);
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "Backspace" && entry === "" && tags.length > 0) {
      onRemove(tags[tags.length - 1]!);
    }
  }

  const showPopover = open && !disabled && rows.length > 0;

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      style={{
        position: "relative",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 6,
        minHeight: 45,
        padding: "7px 10px",
        background: "var(--bs-white)",
        border: `1px solid ${open ? "var(--bs-azure)" : "rgba(64,63,76,0.15)"}`,
        boxShadow: open ? "var(--focus-ring-azure)" : "none",
        borderRadius: "var(--radius-control)",
        cursor: "text",
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          style={{
            ...mono,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 6px 5px 10px",
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
            onClick={(e) => {
              e.stopPropagation();
              onRemove(tag);
            }}
            style={{
              border: "none",
              background: "none",
              cursor: disabled ? "default" : "pointer",
              padding: 2,
              display: "inline-flex",
              color: "rgba(64,63,76,0.55)",
            }}
          >
            <Cross />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={entry}
        placeholder={tags.length === 0 ? placeholder : "Add a tag"}
        disabled={disabled}
        role="combobox"
        aria-expanded={showPopover}
        aria-autocomplete="list"
        onChange={(e) => {
          setEntry(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setOpen(false);
          setEntry("");
        }}
        onKeyDown={onKeyDown}
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 15,
          color: "var(--bs-gunmetal)",
          background: "transparent",
          border: "none",
          outline: "none",
          padding: "0 4px",
          flex: "1 1 80px",
          minWidth: 80,
          height: 27,
        }}
      />
      {showPopover && (
        <div
          role="listbox"
          onMouseDown={(e) => e.preventDefault()}
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            padding: 6,
            background: "var(--bs-white)",
            border: "1px solid rgba(64,63,76,0.15)",
            borderRadius: "var(--radius-control)",
            boxShadow: "0 12px 32px rgba(20,19,26,0.14)",
          }}
        >
          {entry.trim() === "" && <span style={columnHead}>RECENT</span>}
          {options.map((option, i) => (
            <div
              key={option.slug}
              role="option"
              aria-selected={i === highlighted}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(option.name)}
              style={rowStyle(i === highlighted)}
            >
              <MarkedName name={option.name} query={entry} />
              <span style={{ fontWeight: 400, fontSize: 10, color: "rgba(64,63,76,0.55)" }}>
                {option.count}
              </span>
            </div>
          ))}
          {create !== null && (
            <>
              {options.length > 0 && (
                <div style={{ height: 1, margin: "4px 4px", background: "rgba(64,63,76,0.1)" }} />
              )}
              <div
                role="option"
                aria-selected={highlighted === options.length}
                onMouseEnter={() => setActive(options.length)}
                onClick={() => pick(create)}
                style={{
                  ...rowStyle(highlighted === options.length),
                  justifyContent: "flex-start",
                }}
              >
                <Plus />
                <span>CREATE “{create.toUpperCase()}”</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
