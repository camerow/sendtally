import React from "react";

export type NameFieldProps = {
  label: string;
  value: string;
  maxLength: number;
  placeholder: string;
  readOnly?: boolean;
  autoFocus?: boolean;
  onChange: (value: string) => void;
  /** Enter, which never starts a new line in a name. */
  onEnter?: () => void;
};

/** A name in the editor's title type that wraps onto as many lines as it needs instead of clipping. */
export function NameField({
  label,
  onChange,
  onEnter,
  ...field
}: NameFieldProps): React.ReactElement {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  React.useLayoutEffect(() => {
    const box = ref.current;
    if (box === null) return;
    box.style.height = "auto";
    box.style.height = `${box.scrollHeight}px`;
  });
  return (
    <textarea
      ref={ref}
      className="name-field"
      aria-label={label}
      rows={1}
      {...field}
      onChange={(e) => onChange(e.target.value.replace(/\n/g, ""))}
      onKeyDown={(e) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        onEnter?.();
      }}
    />
  );
}
