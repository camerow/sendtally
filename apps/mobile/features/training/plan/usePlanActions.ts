import { Alert } from "react-native";
import { t } from "@sendtally/features/i18n";
import { usePlanActions as usePlanWrites, type PlanActions } from "@sendtally/features/training";
import { useApi } from "../../../lib/api";

const reportFailure = (): void => Alert.alert(t("hang.saveFailed"));

/** Plan writes, with a failed one reported the way hangboard writes are. */
export function usePlanActions(): PlanActions {
  return usePlanWrites(useApi(), reportFailure);
}
