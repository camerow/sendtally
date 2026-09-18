import React from "react";

/** Form values, prefilled once from the caller's pending draft when there is one to load. */
export function useDraftForm<T>(
  initial: T,
  load: (() => Promise<T>) | null
): [T, (values: T) => void, boolean] {
  const [values, setValues] = React.useState(initial);
  const [loaded, setLoaded] = React.useState(load === null);
  const loadOnce = React.useRef(load);

  React.useEffect(() => {
    const pending = loadOnce.current;
    if (pending === null) return;
    let live = true;
    pending()
      .then((next) => {
        if (live) setValues(next);
      })
      .finally(() => {
        if (live) setLoaded(true);
      });
    return () => {
      live = false;
    };
  }, []);

  return [values, setValues, loaded];
}
