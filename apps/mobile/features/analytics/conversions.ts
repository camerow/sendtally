import { getAnalytics, logEvent } from "@react-native-firebase/analytics";
import { IS_E2E } from "../../lib/config";

export type Conversion = "account_created" | "membership_started";

export function logConversion(name: Conversion, params: Record<string, string> = {}): void {
  if (!IS_E2E) logEvent(getAnalytics(), name, params);
}
