import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import { t } from "@sendtally/features/i18n";
import { usePlanActions } from "../plan/usePlanActions";

const DEFAULT_WEEKS = 4;

/** New block: an untitled template, opened at once with its name to type while it saves. */
export function useNewBlock(): () => void {
  const actions = usePlanActions();
  return () => {
    const id = randomUUID();
    void actions.saveBlock({ id, name: "", start: null, weeks: DEFAULT_WEEKS, focus: null });
    router.push({
      pathname: "/plan/block/[id]",
      params: { id, fresh: "1", back: t("training.train") },
    });
  };
}
