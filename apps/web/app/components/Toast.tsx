import React from "react";

export type ToastMessage = {
  message: string;
  /** One link, such as Undo or View, that also dismisses it. */
  action?: { label: string; onPress: () => void };
};

type Shown = ToastMessage & { id: number };

const SHOWN_MS = 4000;

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
    setShown({ ...toast, id: next.current });
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
      <div role="status" aria-live="polite" className="toast-region">
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
