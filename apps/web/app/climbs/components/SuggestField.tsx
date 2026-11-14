import React from "react";
import { t } from "@sendtally/features/i18n";

export type Suggestion = { key: string; name: string; meta: string };

export type SuggestFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  suggestions: readonly Suggestion[];
  /** What was typed is not found anywhere, so saving creates it. */
  isNew: boolean;
  hint?: string | null;
  onChangeText: (text: string) => void;
  onPick: (key: string) => void;
};

/** A text field whose matches open under it while it is focused; anything else typed is new. */
export function SuggestField({
  label,
  value,
  placeholder,
  suggestions,
  isNew,
  hint = null,
  onChangeText,
  onPick,
}: SuggestFieldProps): React.ReactElement {
  const [focused, setFocused] = React.useState(false);
  const input = React.useRef<HTMLInputElement>(null);
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <span className={focused ? "suggest-box suggest-box--focused" : "suggest-box"}>
        <input
          ref={input}
          className="suggest-input"
          value={value}
          placeholder={placeholder}
          aria-label={label}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          onChange={(e) => onChangeText(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {isNew && !focused && <span className="suggest-new">{t("climbs.new")}</span>}
      </span>
      {hint !== null && <span className="suggest-hint">{hint}</span>}
      {focused && suggestions.length > 0 && (
        <div className="suggest-list">
          {suggestions.map((s) => (
            <button
              key={s.key}
              type="button"
              className="suggest-row"
              aria-label={s.meta === "" ? s.name : `${s.name}, ${s.meta}`}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => {
                onPick(s.key);
                input.current?.blur();
              }}
            >
              <span className="suggest-name">{s.name}</span>
              <span className="suggest-meta">{s.meta}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
