import React from "react";

/** A ref that always holds the latest `value`, for a callback read later from a timer or an effect. */
export function useLatest<T>(value: T): React.RefObject<T> {
  const ref = React.useRef(value);
  React.useEffect(() => {
    ref.current = value;
  });
  return ref;
}
