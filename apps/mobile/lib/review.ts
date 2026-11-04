import * as SecureStore from "expo-secure-store";
import * as StoreReview from "expo-store-review";
import { IS_E2E } from "./config";

const ASKED_KEY = "review-prompt-shown";
const MIN_SESSIONS = 5;

export async function maybeAskForReview(sessionCount: number): Promise<void> {
  if (IS_E2E || sessionCount < MIN_SESSIONS) return;
  if ((await SecureStore.getItemAsync(ASKED_KEY)) !== null) return;
  if (!(await StoreReview.hasAction())) return;
  await SecureStore.setItemAsync(ASKED_KEY, "1");
  await StoreReview.requestReview();
}
