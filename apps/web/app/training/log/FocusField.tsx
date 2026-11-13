import React from "react";
import { FOCI, type Focus } from "@sendtally/core/hang";
import { t } from "@sendtally/features/i18n";
import { focusLabel, focusMeaning, focusParam, readFocus } from "@sendtally/features/training";

export type FocusFieldProps = { value: Focus | null; onChange: (focus: Focus | null) => void };

/** Pick what something trains for: General first, then the seven in season order. */
export function FocusField({ value, onChange }: FocusFieldProps): React.ReactElement {
  const id = React.useId();
  return (
    <div className="form-section">
      <label htmlFor={id} className="train-label">
        {t("focus.label")}
      </label>
      <select
        id={id}
        className="form-input"
        value={focusParam(value)}
        onChange={(e) => onChange(readFocus(e.target.value) ?? null)}
      >
        {[null, ...FOCI].map((f) => (
          <option key={focusParam(f)} value={focusParam(f)}>
            {focusLabel(f)}
          </option>
        ))}
      </select>
      <p className="form-hint">{focusMeaning(value)}</p>
    </div>
  );
}
