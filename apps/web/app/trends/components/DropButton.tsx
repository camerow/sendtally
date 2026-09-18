import React from "react";

function Chevron(): React.ReactElement {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path
        d="M2.5 4.5 6 8l3.5-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export { Chevron };

/** Closes on a click anywhere outside it or on Escape, so only one reads as open at a time. */
export function useDismiss(
  open: boolean,
  close: () => void
): React.RefObject<HTMLDivElement | null> {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent): void => {
      if (ref.current !== null && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

export function DropButton({
  label,
  value,
  active,
  disabled = false,
  width,
  children,
}: {
  label: string;
  value: string;
  active: boolean;
  disabled?: boolean;
  width: number;
  children: (close: () => void) => React.ReactNode;
}): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback((): void => setOpen(false), []);
  const ref = useDismiss(open, close);
  return (
    <div className="trend-drop" ref={ref}>
      <button
        type="button"
        className="trend-drop-button"
        data-active={active}
        aria-expanded={open}
        aria-disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
      >
        <span className="trend-drop-text">
          <span className="trend-drop-label trend-mono">{label}</span>
          <span className="trend-drop-value">{value}</span>
        </span>
        <Chevron />
      </button>
      {open && (
        <div className="trend-popover" style={{ width }}>
          {children(close)}
        </div>
      )}
    </div>
  );
}
