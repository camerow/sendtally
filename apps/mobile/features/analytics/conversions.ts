import { getAnalytics, logEvent } from "@react-native-firebase/analytics";
import { IS_E2E } from "../../lib/config";

export type Conversion = "account_created" | "membership_started";

// Google Ads imports these from Firebase as in-app conversions. They share their
// names with the server's PostHog events, and like those carry only enums.
export function logConversion(name: Conversion, params: Record<string, string> = {}): void {
  if (!IS_E2E) logEvent(getAnalytics(), name, params);
}
