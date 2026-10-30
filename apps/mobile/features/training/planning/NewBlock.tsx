import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import React from "react";
import { t } from "@sendtally/features/i18n";
import { usePlanActions } from "../plan/usePlanActions";

const DEFAULT_WEEKS = 4;

/** New block: an untitled template, made at once and opened with its name to type. */
export function NewBlock(): null {
  const actions = usePlanActions();
  const made = React.useRef(false);
  React.useEffect(() => {
    if (made.current) return;
    made.current = true;
    const id = randomUUID();
    void actions
      .saveBlock({ id, name: "", start: null, weeks: DEFAULT_WEEKS, focus: null })
      .then(() =>
        router.replace({
          pathname: "/plan/block/[id]",
          params: { id, fresh: "1", back: t("training.train") },
        })
      );
  }, [actions]);
  return null;
}
