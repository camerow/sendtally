import React from "react";

export type ComboItem = {
  key: string;
  label: React.ReactNode;
  meta?: React.ReactNode;
  /** An action row, such as adding what was typed, rather than a match. */
  action?: boolean;
  /** A heading drawn above this row when it differs from the previous row's. */
  section?: string;
  /** A second, quieter line under the label, such as where the row is. */
  detail?: string;
  onPick: () => void;
};

export type ComboFieldProps = {
  value: string;
  items: ComboItem[];
  inline?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  id?: string;
  className?: string;
  inputStyle: React.CSSProperties;
  trailing?: React.ReactNode;
  /** Drawn inside the field before the text, such as the chips of a picked path. */
  leading?: React.ReactNode;
  /** Backspace in an empty field, for taking back the last of the leading chips. */
  onEmptyBackspace?: () => void;
  onChange: (value: string) => void;
  onFocus?: () => void;
};

const headingStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 10,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(64,63,76,0.55)",
  padding: "6px 10px 4px",
};

const rowStyle = (active: boolean, action: boolean): React.CSSProperties => ({
  fontFamily: "var(--font-mono)",
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: "0.06em",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  minHeight: 36,
  padding: "0 10px",
  borderRadius: "var(--radius-sm)",
  background: active ? "var(--surface-soft)" : "transparent",
  color: action ? "var(--bs-azure-ink)" : "var(--bs-gunmetal)",
  cursor: "pointer",
});

/** The right padding the caller's style gives, so it can be widened without mixing shorthands. */
function edgePadding(style: React.CSSProperties): string | number | undefined {
  if (typeof style.padding !== "string") return style.padding;
  const parts = style.padding.split(" ");
  return parts[1] ?? parts[0];
}

/** A text field with a dropdown of picks under it; typing stays free text until a row is picked. */
export function ComboField({
  value,
  items,
  inline = false,
  autoFocus = false,
  placeholder,
  ariaLabel,
  id,
  className,
  inputStyle,
  trailing,
  leading,
  onEmptyBackspace,
  onChange,
  onFocus,
}: ComboFieldProps): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const highlighted = Math.min(active, Math.max(items.length - 1, 0));
  const showList = open && items.length > 0;

  function pick(item: ComboItem): void {
    setOpen(false);
    setActive(0);
    item.onPick();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setActive((i) =>
        e.key === "ArrowDown" ? Math.min(i + 1, items.length - 1) : Math.max(i - 1, 0)
      );
      return;
    }
    if (e.key === "Enter" && showList) {
      const choice = items[highlighted];
      if (choice === undefined) return;
      e.preventDefault();
      pick(choice);
      return;
    }
    if (e.key === "Backspace" && value === "" && onEmptyBackspace !== undefined) {
      e.preventDefault();
      onEmptyBackspace();
      return;
    }
    if (e.key === "Escape") setOpen(false);
  }

  const frame: React.CSSProperties = {
    ...inputStyle,
    paddingRight: trailing === undefined ? edgePadding(inputStyle) : 72,
    borderColor: open ? "var(--bs-azure)" : "rgba(64,63,76,0.15)",
    boxShadow: open ? "var(--focus-ring-azure)" : "none",
  };

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
      <div
        style={
          leading === undefined
            ? { position: "relative" }
            : {
                ...frame,
                position: "relative",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 6,
                paddingTop: 7,
                paddingBottom: 7,
                paddingLeft: 8,
              }
        }
      >
        {leading}
        <input
          id={id}
          value={value}
          placeholder={placeholder}
          aria-label={ariaLabel}
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
          onFocus={() => {
            setOpen(true);
            onFocus?.();
          }}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          className={leading === undefined ? className : undefined}
          style={
            leading === undefined
              ? frame
              : {
                  flex: "1 1 80px",
                  minWidth: 80,
                  border: "none",
                  outline: "none",
                  padding: "4px 2px",
                  background: "transparent",
                  font: "inherit",
                  fontSize: inputStyle.fontSize,
                  color: "var(--bs-gunmetal)",
                }
          }
        />
        {trailing !== undefined && (
          <span
            style={{
              position: "absolute",
              right: 10,
              top: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
            }}
          >
            {trailing}
          </span>
        )}
      </div>
      {showList && (
        <div
          role="listbox"
          onMouseDown={(e) => e.preventDefault()}
          className={inline ? "combo-list combo-list--inline" : "combo-list"}
        >
          {items.map((item, i) => (
            <React.Fragment key={item.key}>
              {item.section !== undefined && item.section !== items[i - 1]?.section && (
                <span style={headingStyle}>{item.section}</span>
              )}
              <div
                role="option"
                aria-selected={i === highlighted}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(item)}
                style={rowStyle(i === highlighted, item.action === true)}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    minWidth: 0,
                    textTransform: "uppercase",
                    overflowWrap: "anywhere",
                    padding: "8px 0",
                  }}
                >
                  {item.detail === undefined ? (
                    item.label
                  ) : (
                    <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                        {item.label}
                      </span>
                      <span style={{ color: "rgba(64,63,76,0.62)", fontWeight: 400 }}>
                        {item.detail}
                      </span>
                    </span>
                  )}
                </span>
                {item.meta !== undefined && (
                  <span
                    style={{
                      color: "rgba(64,63,76,0.55)",
                      flex: "none",
                      textTransform: "uppercase",
                    }}
                  >
                    {item.meta}
                  </span>
                )}
              </div>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
