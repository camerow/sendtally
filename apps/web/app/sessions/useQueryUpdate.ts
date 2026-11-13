import { useSearchParams } from "react-router";

/** Changes the page's search params in place: no new history entry and no scroll to the top. */
export function useQueryUpdate(): (change: (params: URLSearchParams) => void) => void {
  const [, setParams] = useSearchParams();
  return (change) =>
    setParams(
      (was) => {
        const next = new URLSearchParams(was);
        change(next);
        return next;
      },
      { replace: true, preventScrollReset: true }
    );
}
