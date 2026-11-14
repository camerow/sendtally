import React from "react";

export type ToastMessage = {
  message: string;
  /** One link, such as Undo or View, that also dismisses it. */
  action?: { label: string; onPress: () => void };
};

/** `lift` is how far above the window's bottom it sits to clear a screen footer, if one shows. */
type Shown = ToastMessage & { id: number; lift: number | null };

const SHOWN_MS = 4000;
const ABOVE_FOOTER = 12;

/** A detail screen's sticky footer holds its main action, so a toast sits just above it. */
function footerLift(): number | null {
  const footer = document.querySelector(".detail-footer");
  return footer === null
    ? null
    : window.innerHeight - footer.getBoundingClientRect().top + ABOVE_FOOTER;
}

const ToastContext = React.createContext<((toast: ToastMessage) => void) | null>(null);

export function useToast(): { show: (toast: ToastMessage) => void } {
  const show = React.useContext(ToastContext);
  if (show === null) throw new Error("useToast needs a ToastProvider");
  return React.useMemo(() => ({ show }), [show]);
}

/** A short word on what just happened, at the foot of the page, gone after a few seconds. */
export function ToastProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [shown, setShown] = React.useState<Shown | null>(null);
  const next = React.useRef(0);
  const show = React.useCallback((toast: ToastMessage) => {
    next.current += 1;
    setShown({ ...toast, id: next.current, lift: footerLift() });
  }, []);
  const id = shown?.id;
  React.useEffect(() => {
    if (id === undefined) return;
    const timer = setTimeout(() => setShown(null), SHOWN_MS);
    return () => clearTimeout(timer);
  }, [id]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="toast-region"
        style={shown?.lift == null ? undefined : { bottom: shown.lift }}
      >
        {shown !== null && (
          <div key={shown.id} className="toast">
            <span className="toast-message">{shown.message}</span>
            {shown.action !== undefined && (
              <button
                type="button"
                className="toast-action"
                onClick={() => {
                  setShown(null);
                  shown.action?.onPress();
                }}
              >
                {shown.action.label}
              </button>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
