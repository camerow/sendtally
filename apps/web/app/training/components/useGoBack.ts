import { useNavigate } from "react-router";

/** Back through history, or to `fallback` when the page was opened directly. */
export function useGoBack(fallback: string): () => void {
  const navigate = useNavigate();
  return () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    void (idx > 0 ? navigate(-1) : navigate(fallback, { replace: true }));
  };
}
