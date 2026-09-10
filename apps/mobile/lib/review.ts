import * as SecureStore from "expo-secure-store";
import * as StoreReview from "expo-store-review";

const ASKED_KEY = "review-prompt-shown";
const MIN_SESSIONS = 5;

export async function maybeAskForReview(sessionCount: number): Promise<void> {
  if (sessionCount < MIN_SESSIONS) return;
  if ((await SecureStore.getItemAsync(ASKED_KEY)) !== null) return;
  if (!(await StoreReview.hasAction())) return;
  await SecureStore.setItemAsync(ASKED_KEY, "1");
  await StoreReview.requestReview();
}
