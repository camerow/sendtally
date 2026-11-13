import { useNavigate } from "react-router";
import { usePlanActions } from "../data/usePlanActions";
import { blockPath } from "./paths";

const DEFAULT_WEEKS = 4;

/** New block: an untitled template, opened at once in Edit mode with its name to type while it saves. */
export function useNewBlock(): () => void {
  const actions = usePlanActions();
  const navigate = useNavigate();
  return () => {
    const id = crypto.randomUUID();
    void actions.saveBlock({ id, name: "", start: null, weeks: DEFAULT_WEEKS, focus: null });
    void navigate(blockPath(id, { fresh: true }));
  };
}
