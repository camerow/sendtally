import React from "react";

export type SwitchProps = {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  label: string;
};

export function Switch({
  checked,
  onChange,
  disabled = false,
  label,
}: SwitchProps): React.ReactElement {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        width: 46,
        height: 28,
        flexShrink: 0,
        padding: 3,
        border: "none",
        boxSizing: "border-box",
        borderRadius: "var(--radius-pill)",
        background: checked ? "var(--bs-azure-ink)" : "rgba(64,63,76,0.22)",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.55 : 1,
        transition: "background var(--motion-fast)",
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: "var(--radius-pill)",
          background: "var(--bs-white)",
          marginLeft: checked ? 18 : 0,
          transition: "margin-left var(--motion-fast)",
        }}
      />
    </button>
  );
}

/** A switch on a row with its label, and a muted hint under the label when given. */
export function SwitchField({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}): React.ReactElement {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 44 }}>
      <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, fontSize: 15 }}>
        <span>{label}</span>
        {hint !== undefined && (
          <span style={{ fontSize: 12.5, color: "var(--text-on-white-secondary)" }}>{hint}</span>
        )}
      </span>
      <Switch checked={checked} onChange={onChange} label={label} />
    </div>
  );
}
