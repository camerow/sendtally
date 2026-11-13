import React from "react";

/** An on/off switch with its label beside it. */
export function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (on: boolean) => void;
}): React.ReactElement {
  const id = React.useId();
  return (
    <label htmlFor={id} className="toggle-row">
      <span className="toggle-text">
        <span>{label}</span>
        {hint !== undefined && <span className="form-hint">{hint}</span>}
      </span>
      <input
        id={id}
        type="checkbox"
        role="switch"
        className="toggle"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
