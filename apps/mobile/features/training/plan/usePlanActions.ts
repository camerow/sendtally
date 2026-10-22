import { Alert } from "react-native";
import { useActivityActions, type ActivityActions } from "@sendtally/features/activities";
import { t } from "@sendtally/features/i18n";
import { useApi } from "../../../lib/api";

const reportFailure = (): void => Alert.alert(t("hang.saveFailed"));

/** Plan item writes, with a failed one reported the way hangboard writes are. */
export function usePlanActions(): ActivityActions {
  return useActivityActions(useApi(), reportFailure);
}
