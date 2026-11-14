import React from "react";
import { t } from "@sendtally/features/i18n";
import { usePlanActions as usePlanWrites, type PlanActions } from "@sendtally/features/training";
import { useToast } from "../../components/Toast";
import { useAppApi } from "../../lib/useAppApi";

/** Plan writes, with a failed one said in a toast. */
export function usePlanActions(): PlanActions {
  const toast = useToast();
  const failed = React.useCallback(() => toast.show({ message: t("hang.saveFailed") }), [toast]);
  return usePlanWrites(useAppApi(), failed);
}
